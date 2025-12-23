# Transaction Deduplication System

A world-class 3-tier deduplication engine that accurately detects duplicate transactions even when descriptions are completely different between sources (e.g., raw bank CSV vs clean Plaid merchant names).

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
│  └─────────────────────────────────────────────────────┘    │
│                    Match? ──► DUPLICATE                      │
└─────────────────────────────────────────────────────────────┘
                              │ No match
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 2: Embedding Similarity (~$0.02/1000 txns)         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OpenAI text-embedding-3-small                       │    │
│  │  Cosine similarity (threshold: 0.82)                 │    │
│  │  In-memory caching during imports                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                    Match? ──► DUPLICATE                      │
│              Uncertain (0.65-0.82)? ──► Tier 3              │
└─────────────────────────────────────────────────────────────┘
                              │ No match
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 3: LLM Verification (~$0.0003/20 comparisons)      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GPT-4o-mini with function calling                   │    │
│  │  Structured output via report_transaction_matches    │    │
│  │  Batch processing for efficiency                     │    │
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
├── embedding-matcher.ts  # OpenAI embeddings + caching
└── llm-verifier.ts       # GPT-4o-mini function calling

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

## Tier 2: Embedding Similarity

Uses OpenAI's `text-embedding-3-small` model for semantic matching.

```typescript
import { getEmbedding, cosineSimilarity } from '@/lib/dedup/embedding-matcher';

const [emb1, emb2] = await Promise.all([
  getEmbedding("RAISING CANES 0724 MANASSAS VA"),
  getEmbedding("Raising Cane's Chicken Fingers"),
]);
const score = cosineSimilarity(emb1, emb2);
// Returns: 0.89 (above 0.82 threshold = match)
```

**Cost:** ~$0.00002 per 1K tokens (~$0.02 per 1,000 transactions)

**Features:**
- Batch embedding requests via `getEmbeddingsBatch()` for efficiency
- In-memory caching during import sessions
- Automatic cache clearing after import via `clearEmbeddingCache()`

## Tier 3: LLM Verification

Uses GPT-4o-mini with function calling for human-like judgment on uncertain cases.

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
- Low temperature (0.1) for consistent results

## Usage

### In CSV Upload (Automatic)

The upload wizard automatically uses the deduplication system:

```typescript
// src/app/upload/upload-interface.tsx
import { analyzeForDuplicates } from '@/actions/dedup';

const result = await analyzeForDuplicates(
  transactions,
  accountId,
  true // useAI: enables Tier 2 & 3
);

// result.unique - transactions to import
// result.duplicates - detected duplicates with confidence scores
// result.stats - processing metrics
```

### In Plaid Sync (Automatic)

When Plaid syncs transactions, it automatically checks for matching CSV transactions using the **full 3-tier system** (deterministic + embeddings + LLM). If a match is found, instead of creating a duplicate:

1. The existing CSV transaction is **upgraded** with Plaid data
2. `plaidTransactionId`, `plaidMerchantName`, `plaidAuthorizedDate`, etc. are added
3. No new transaction is created

This enables bi-directional data enrichment:
- Import CSV first → Plaid sync adds merchant names and authorized dates
- Sync Plaid first → CSV import detects duplicates and skips them

**Note:** Plaid sync waits for data enrichment before proceeding. On initial connection, Plaid needs time to populate `authorized_date` and `merchant_name` fields. The sync retries with exponential backoff until enriched data is available.

```typescript
// src/actions/plaid.ts - findDuplicateCsvTransaction()
// Uses full 3-tier dedup system (deterministic + embeddings + LLM)
const result = await findDuplicatesBatch([plaidTx], existingTxs, {
  skipEmbeddings: false, // Use all tiers
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
      // ... other Plaid fields
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
    skipEmbeddings: false, // Set true to skip Tier 2 & 3
    onProgress: (processed, total) => {
      console.log(`${processed}/${total}`);
    }
  }
);

console.log(`Unique: ${result.stats.unique}`);
console.log(`Duplicates: ${result.stats.duplicates}`);
console.log(`Tier 1 matches: ${result.stats.tier1Matches}`);
console.log(`Tier 2 matches: ${result.stats.tier2Matches}`);
console.log(`Tier 3 matches: ${result.stats.tier3Matches}`);
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
# Required for Tier 2 & 3
OPENAI_API_KEY=sk-...
```

### Thresholds

| Tier | Threshold | Meaning |
|------|-----------|---------|
| Tier 1 | 0.88 | Jaro-Winkler similarity |
| Tier 2 | 0.82 | Embedding cosine similarity (match) |
| Tier 2 | 0.65 | Embedding cosine similarity (uncertain → Tier 3) |

## Cost Estimates

For a typical 1,000 transaction import with 200 potential duplicates:

| Tier | Transactions | Cost |
|------|-------------|------|
| Tier 1 (deterministic) | 200 | $0.00 |
| Tier 2 (embeddings) | ~50 | ~$0.01 |
| Tier 3 (LLM) | ~10 | ~$0.005 |
| **Total** | | **~$0.015** |

## Test Results

All test cases pass with Tier 1 alone:

```
✅ "AplPay CHIPOTLE 1249GAINESVILLE VA" vs "Chipotle Mexican Grill"
✅ "RAISING CANES 0724 MANASSAS VA" vs "Raising Cane's Chicken Fingers"
✅ "AplPay HARRIS TEETERBRISTOW VA" vs "Harris Teeter Supermarkets, Inc."
✅ "SPIRIT HALLOWEEN 612..." vs "Spirit Halloween Superstores"
✅ "AplPay CINEMARK PLANO TX" vs "Cinemark Theatres"
✅ "CHIPOTLE 1249" ≠ "Taco Bell" (correctly identified as different)
✅ "TARGET 1234" ≠ "Walmart" (correctly identified as different)
```

## Database Schema

The system optionally caches embeddings for faster future lookups:

```prisma
model TransactionEmbedding {
  id            String   @id @default(uuid())
  transactionId String   @unique @map("transaction_id")
  embedding     Bytes    // 1536 floats = 6144 bytes
  createdAt     String   @map("created_at")

  transaction   Transaction @relation(...)
  
  @@map("transaction_embeddings")
}
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
const TIER1_THRESHOLD = 0.88;       // Increase for stricter matching
const TIER2_THRESHOLD = 0.82;       // Decrease to catch more matches
const TIER2_UNCERTAIN_THRESHOLD = 0.65; // Decrease to send more to LLM
```

### Custom LLM Prompts

Edit `src/lib/dedup/llm-verifier.ts` to modify the system prompt with domain-specific examples.

