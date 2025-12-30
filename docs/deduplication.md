# Transaction Deduplication System

A 2-tier deduplication engine that accurately detects duplicate transactions even when descriptions are completely different between sources (e.g., raw bank CSV vs clean Plaid merchant names).

## The Problem

The same transaction can appear with completely different descriptions:

| Source | Description |
|--------|-------------|
| Amex CSV | `AplPay CHIPOTLE 1249GAINESVILLE VA` |
| Plaid | `Chipotle Mexican Grill` |

Simple substring matching fails because neither string contains the other. Our system solves this with a multi-tier approach.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Input Transaction                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Pre-Filter: Date (±2 days) + |Amount| Match     │
│     (Indexes both authorized_date and posted_date for Plaid) │
│     (±2 day window handles bank-specific date offsets)       │
│     (Amex: 0 offset, Chase: up to -2 days from posted_date)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 1: Deterministic Matching (CLIENT-SIDE)            │
│     Location: @somar/shared/dedup                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Extract merchant name (strip prefixes/suffixes)  │    │
│  │  2. Jaro-Winkler similarity (threshold: 0.88)        │    │
│  │  3. Token overlap detection                          │    │
│  │  4. Plaid merchant name comparison                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                    Match? ──► DUPLICATE (definiteMatch)      │
│                    Candidates but no match? ──► uncertainPair│
└─────────────────────────────────────────────────────────────┘
                              │ Uncertain pairs
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 2: LLM Verification (SERVER API)                   │
│     Endpoint: POST /api/dedup/verify                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  gpt-5-mini with function calling                    │    │
│  │  Structured output via report_transaction_matches    │    │
│  │  Batch processing (max 100 pairs per request)        │    │
│  │  Only called when date+amount match exists           │    │
│  └─────────────────────────────────────────────────────┘    │
│                    Match? ──► DUPLICATE                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                           UNIQUE
```

## File Structure

```
packages/shared/src/dedup/     # Tier 1 - Client-side (web + mobile)
├── index.ts                   # Public exports
├── types.ts                   # Shared type definitions
├── tier1.ts                   # Tier 1 matching logic
├── merchant-extractor.ts      # Extracts merchant names (50+ patterns)
├── jaro-winkler.ts            # String similarity algorithms
└── batch-utils.ts             # Batching utilities (LLM_API_BATCH_LIMIT)

apps/web/src/lib/dedup/        # Tier 2 - Server-side (LLM)
├── index.ts                   # Re-exports shared + findDuplicatesBatch()
└── llm-verifier.ts            # LLM function calling for uncertain cases

apps/web/src/app/api/dedup/
└── verify/route.ts            # POST /api/dedup/verify - LLM-only endpoint
```

## Tier 1: Deterministic Matching (Client-Side)

Tier 1 runs entirely on the client (browser/mobile) using `@somar/shared/dedup`. This provides:
- **Zero latency** - No network round-trip for deterministic matches
- **Mobile-ready** - Same code works in React Native
- **Cost-free** - No API calls for high-confidence matches

### Merchant Name Extraction

Strips common prefixes and suffixes to extract the core merchant name:

```typescript
import { extractMerchantName } from '@somar/shared/dedup';

extractMerchantName("AplPay CHIPOTLE 1249GAINESVILLE VA")
// Returns: "CHIPOTLE"

extractMerchantName("TST* ROCKWOOD - GAINGAINESVILLE VA")
// Returns: "ROCKWOOD"
```

**Patterns removed:**
- Payment prefixes: `AplPay`, `Apple Pay`, `SQ *`, `TST*`, `PAYPAL *`, etc.
- Location suffixes: City names, state codes, ZIP codes
- Reference IDs: Store numbers, transaction IDs, dates
- Corporate suffixes: `INC`, `LLC`, `CORP`, etc.

### Jaro-Winkler Similarity

Better than Levenshtein for merchant names because:
1. Higher scores for strings matching from the beginning
2. More tolerant of typos and minor variations
3. Returns 0-1 score (1 = perfect match)

```typescript
import { jaroWinkler } from '@somar/shared/dedup';

jaroWinkler("CHIPOTLE", "CHIPOTLE MEXICAN GRILL")
// Returns: 0.873
```

### Token Overlap Detection

Checks if significant words appear in both descriptions:

```typescript
import { hasSignificantTokenOverlap } from '@somar/shared/dedup';

hasSignificantTokenOverlap(
  "AplPay CHIPOTLE 1249GAINESVILLE VA",
  "Chipotle Mexican Grill"
)
// Returns: true (both contain "chipotle")
```

### Running Tier 1

```typescript
import { runTier1Dedup } from '@somar/shared/dedup';

const tier1Result = runTier1Dedup(newTransactions, existingTransactions);

// tier1Result.definiteMatches - High confidence, no LLM needed
// tier1Result.uncertainPairs - Need LLM verification
// tier1Result.unique - No candidates found
// tier1Result.stats - Processing metrics
```

## Tier 2: LLM Verification (Server API)

Uses gpt-5-mini with function calling for human-like judgment on uncertain cases. Only called when Tier 1 doesn't find a match but there are date+amount matching candidates.

### API Endpoint

```
POST /api/dedup/verify

Request:
{
  "uncertainPairs": [
    {
      "newTransaction": { "id": "...", "description": "...", "amount": -34.98, "date": "2025-09-27" },
      "candidate": { "id": "...", "description": "...", "amount": -34.98, "date": "2025-09-27" },
      "tier1Score": 0.65
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "matches": [
      { "newTransactionId": "...", "newTransactionDescription": "...", "candidateId": "...", "confidence": 0.95 }
    ],
    "nonMatches": ["..."],
    "stats": { "totalPairs": 1, "matchesFound": 1, "processingTimeMs": 1234 }
  }
}
```

**Limits:**
- Max 100 pairs per request
- Client must batch using `chunkArray()` utility

**Cost:** ~$0.0003 per batch of 20 comparisons

## Usage

### In CSV Upload (Automatic)

The upload wizard runs Tier 1 client-side, then calls the API for uncertain pairs:

```typescript
// apps/web/src/app/upload/upload-interface.tsx
import { runTier1Dedup, chunkArray, LLM_API_BATCH_LIMIT } from '@somar/shared/dedup';

// Step 1: Run Tier 1 locally
const tier1Result = runTier1Dedup(newTransactions, existingTransactions);

// Step 2: If uncertain pairs exist, call API with batching
if (tier1Result.uncertainPairs.length > 0) {
  const batches = chunkArray(tier1Result.uncertainPairs, LLM_API_BATCH_LIMIT);
  for (const batch of batches) {
    const response = await fetch("/api/dedup/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uncertainPairs: batch }),
    });
    // Process LLM results...
  }
}
```

### In Plaid Sync (Automatic)

When Plaid syncs transactions, it runs the same 2-tier process:

1. **Tier 1 client-side** - Fast deterministic matching
2. **Tier 2 API** - LLM verification for uncertain cases
3. **Upgrade or Insert** - Matched transactions upgrade existing CSV records

```typescript
// apps/web/src/hooks/use-plaid-sync.ts
import { runTier1Dedup, chunkArray, LLM_API_BATCH_LIMIT } from '@somar/shared/dedup';

// Run Tier 1 locally
const tier1Result = runTier1Dedup(plaidForDedup, existingForDedup);

// Call API for uncertain pairs (with batching)
if (tier1Result.uncertainPairs.length > 0) {
  const batches = chunkArray(tier1Result.uncertainPairs, LLM_API_BATCH_LIMIT);
  // ... process batches
}

// Build duplicate map and process
for (const plaidTx of plaidTxsToProcess) {
  if (duplicateMap.has(plaidTx.transaction_id)) {
    // Upgrade existing CSV transaction with Plaid data
  } else {
    // Insert new transaction
  }
}
```

### Server-Side Usage (for tests)

The web module still exports `findDuplicatesBatch()` for backward compatibility:

```typescript
import { findDuplicatesBatch } from '@/lib/dedup';

const result = await findDuplicatesBatch(
  newTransactions,
  existingTransactions,
  {
    skipLLM: false, // Set true to disable LLM tier
    onProgress: (processed, total) => {
      console.log(`${processed}/${total}`);
    }
  }
);

console.log(`Unique: ${result.stats.unique}`);
console.log(`Duplicates: ${result.stats.duplicates}`);
console.log(`Tier 1 matches: ${result.stats.tier1Matches}`);
console.log(`Tier 2 matches (LLM): ${result.stats.tier2Matches}`);
```

### Deterministic-Only Mode

For fast processing without API calls, use `runTier1Dedup()` directly:

```typescript
import { runTier1Dedup } from '@somar/shared/dedup';

const result = runTier1Dedup(newTransactions, existingTransactions);
// result.definiteMatches + result.unique = all transactions (no LLM)
```

## Configuration

### Environment Variables

```bash
# Required for Tier 2 (LLM) - server-side only
OPENAI_API_KEY=sk-...
```

### Thresholds and Limits

| Setting | Value | Location |
|---------|-------|----------|
| Tier 1 threshold | 0.88 | `@somar/shared/dedup/tier1.ts` |
| LLM batch limit | 100 | `@somar/shared/dedup/batch-utils.ts` |
| Date tolerance | ±2 days | `@somar/shared/dedup/tier1.ts` |

## Cost Estimates

For a typical 1,000 transaction import with 200 potential duplicates:

| Tier | Transactions | Cost |
|------|-------------|------|
| Tier 1 (deterministic) | 200 | $0.00 |
| Tier 2 (LLM) | ~10 | ~$0.005 |
| **Total** | | **~$0.005** |

## Test Results

The test suite verifies both Plaid→CSV and CSV→Plaid deduplication scenarios:

```
Match rate (Plaid after CSV): 100.0% (59/59)
Match rate (CSV after Plaid): 96.7% (59/61)
Processing time: 2-5ms for 60+ transactions
```

All test cases pass with Tier 1 (deterministic) alone:

```
✅ "AplPay BURRITO BARN 1249RIVERDALE XX" vs "Burrito Barn"
✅ "FRIED CHICKEN CO 724OAKVILLE XX" vs "Fried Chicken Company"
✅ "TST* STEAKHOUSE - RIRIVERDALE XX" vs "Steakhouse"
✅ Same amount + date + different merchant → NOT matched (correct)
```

## Extending the System

### Adding New Prefixes

Edit `packages/shared/src/dedup/merchant-extractor.ts`:

```typescript
const PREFIXES = [
  // ... existing prefixes
  "NEW_PREFIX*",
  "ANOTHER PREFIX ",
];
```

### Adjusting Thresholds

Edit `packages/shared/src/dedup/tier1.ts`:

```typescript
export const TIER1_THRESHOLD = 0.88;  // Increase for stricter matching
```

### Custom LLM Prompts

Edit `apps/web/src/lib/dedup/llm-verifier.ts` to modify the system prompt with domain-specific examples.

## Running Tests

```bash
pnpm --filter @somar/web test     # Run all tests
pnpm --filter @somar/web test:watch  # Watch mode for development
```

Tests are located in `apps/web/src/lib/dedup/__tests__/` with anonymized fixture data.
