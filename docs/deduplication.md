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
│     TIER 1: Deterministic Matching (Free, Instant)          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Extract merchant name (strip prefixes/suffixes)  │    │
│  │  2. Jaro-Winkler similarity (threshold: 0.88)        │    │
│  │  3. Token overlap detection                          │    │
│  │  4. Plaid merchant name comparison                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                    Match? ──► DUPLICATE                      │
└─────────────────────────────────────────────────────────────┘
                              │ No match
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 2: LLM Verification (~$0.0003/20 comparisons)      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GPT-4o-mini with function calling                  │    │
│  │  Structured output via report_transaction_matches    │    │
│  │  Batch processing for efficiency                     │    │
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
src/lib/dedup/
├── index.ts              # Main orchestrator, exports findDuplicatesBatch()
├── merchant-extractor.ts # Extracts merchant names (50+ patterns)
├── jaro-winkler.ts       # String similarity algorithms
└── llm-verifier.ts       # LLM function calling for uncertain cases

src/actions/
└── dedup.ts              # Server action for CSV upload integration
```

## Tier 1: Deterministic Matching

### Merchant Name Extraction

Strips common prefixes and suffixes to extract the core merchant name:

```typescript
import { extractMerchantName } from '@/lib/dedup';

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
import { jaroWinkler } from '@/lib/dedup';

jaroWinkler("CHIPOTLE", "CHIPOTLE MEXICAN GRILL")
// Returns: 0.873
```

### Token Overlap Detection

Checks if significant words appear in both descriptions:

```typescript
import { hasSignificantTokenOverlap } from '@/lib/dedup/merchant-extractor';

hasSignificantTokenOverlap(
  "AplPay CHIPOTLE 1249GAINESVILLE VA",
  "Chipotle Mexican Grill"
)
// Returns: true (both contain "chipotle")
```

## Tier 2: LLM Verification

Uses GPT-4o-mini with function calling for human-like judgment on uncertain cases. Only called when Tier 1 doesn't find a match but there are date+amount matching candidates.

```typescript
import { verifyMatchesBatch } from '@/lib/dedup/llm-verifier';

const results = await verifyMatchesBatch([
  {
    newDescription: "AplPay CINEMARK PLANO TX",
    existingDescription: "Cinemark Theatres",
    amount: -34.98,
    date: "2025-09-27"
  }
]);
// Returns: [{ isSameMerchant: true, confidence: "high" }]
```

**Cost:** ~$0.0003 per batch of 20 comparisons

**Features:**
- Function calling for structured, reliable output
- Batch processing (up to 20 pairs per API call)
- Only invoked when there's a strong amount+date match but uncertain description match

## Usage

### In CSV Upload (Automatic)

The upload wizard automatically uses the deduplication system:

```typescript
// src/app/upload/upload-interface.tsx
import { analyzeForDuplicates } from '@/actions/dedup';

const result = await analyzeForDuplicates(
  transactions,
  accountId,
  true // useAI: enables Tier 2 LLM
);

// result.unique - transactions to import
// result.duplicates - detected duplicates with confidence scores
// result.stats - processing metrics
```

### In Plaid Sync (Automatic)

When Plaid syncs transactions, it automatically checks for matching CSV transactions using the **2-tier system** (deterministic + LLM). If a match is found, instead of creating a duplicate:

1. The existing CSV transaction is **upgraded** with Plaid data
2. `plaidTransactionId`, `plaidMerchantName`, `plaidAuthorizedDate`, etc. are added
3. No new transaction is created

This enables bi-directional data enrichment:
- Import CSV first → Plaid sync adds merchant names and authorized dates
- Sync Plaid first → CSV import detects duplicates and skips them

```typescript
// src/actions/plaid.ts - findDuplicateCsvTransaction()
const result = await findDuplicatesBatch([plaidTx], existingTxs, {
  // LLM tier is enabled by default
});

if (result.duplicates.length > 0) {
  const duplicateCsvId = result.duplicates[0].matchedWith.id;
  
  // Upgrade existing CSV transaction with Plaid data
  await db.transaction.update({
    where: { id: duplicateCsvId },
    data: {
      plaidTransactionId: transaction.transaction_id,
      plaidMerchantName: transaction.merchant_name,
      plaidAuthorizedDate: transaction.authorized_date,
      plaidPostedDate: transaction.date,
    },
  });
}
```

### Programmatic Usage

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

For fast processing without API calls:

```typescript
import { findDuplicatesDeterministic } from '@/lib/dedup';

const result = findDuplicatesDeterministic(
  newTransactions,
  existingTransactions
);
```

## Configuration

### Environment Variables

```bash
# Required for Tier 2 (LLM)
OPENAI_API_KEY=sk-...
```

### Thresholds

| Tier | Threshold | Meaning |
|------|-----------|---------|
| Tier 1 | 0.88 | Jaro-Winkler similarity |

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

Edit `src/lib/dedup/merchant-extractor.ts`:

```typescript
const PREFIXES = [
  // ... existing prefixes
  "NEW_PREFIX*",
  "ANOTHER PREFIX ",
];
```

### Adjusting Thresholds

Edit `src/lib/dedup/index.ts`:

```typescript
const TIER1_THRESHOLD = 0.88;  // Increase for stricter matching
```

### Custom LLM Prompts

Edit `src/lib/dedup/llm-verifier.ts` to modify the system prompt with domain-specific examples.

## Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode for development
```

Tests are located in `src/lib/dedup/__tests__/` with anonymized fixture data.
