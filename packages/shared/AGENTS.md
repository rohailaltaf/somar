# Shared Package (@somar/shared)

Platform-agnostic code used by both web and mobile. Contains types, services, hooks, theme, and utilities.

## Subpath Exports

```typescript
// Main exports
import { type AccountType, type CategoryType, type DatabaseAdapter } from "@somar/shared";

// Services (data access)
import { getAllTransactions, confirmTransaction } from "@somar/shared/services";

// Hooks
import { useTransactions, useAccounts, useCategories } from "@somar/shared/hooks";

// Theme
import { hexColors, oklchColors, rgbColors } from "@somar/shared/theme";

// Utilities
import { oklchToHex, formatDate } from "@somar/shared/utils";
```

## DatabaseAdapter Interface

Both platforms implement this interface:
```typescript
export interface DatabaseAdapter {
  all<T>(sql: string, params?: SqlParam[]): T[];
  get<T>(sql: string, params?: SqlParam[]): T | undefined;
  run(sql: string, params?: SqlParam[]): void;
  exec(sql: string): void;
}
```

Platform implementations:
- Web: `apps/web/src/lib/storage/sql-js-adapter.ts`
- Mobile: `apps/mobile/src/lib/storage/expo-sqlite-adapter.ts`

## Services Layer

Pure functions that take `DatabaseAdapter`:
```typescript
// packages/shared/src/services/transactions.ts
export function getAllTransactions(db: DatabaseAdapter): Transaction[] {
  return db.all<Transaction>(`SELECT * FROM transactions ORDER BY date DESC`);
}

export function confirmTransaction(
  db: DatabaseAdapter,
  id: string,
  categoryId: string,
  visibleIds?: string[]
): { updatedIds: string[] } {
  // Marks confirmed, learns pattern, auto-tags visible transactions
}
```

Key functions:
- `getAllTransactions`, `getRecentTransactions`
- `confirmTransaction` - Confirms + learns pattern + auto-tags
- `getTotalSpending`, `getSpendingByCategory`
- `getDailyCumulativeSpending` - For burn-up charts

## Auto-Categorization

Pattern matching priority: learned rules > preset rules
Matching order: exact > starts with > contains

### Pattern Extraction
`extractMerchantPattern()` extracts short, general patterns:
1. Removes prefixes: "PURCHASE ", "POS ", "DEBIT "
2. Removes suffixes: "PAYROLL", "DIR DEP", "PPD"
3. Removes trailing IDs/dates
4. Truncates to ~3 words

Example: `"ACME CORP PAYROLL PPD ID: 123"` → `"ACME CORP"`

## Theme System

Single source of truth in `packages/shared/src/theme/colors.ts`:

```typescript
// oklchColors - Source, used by web CSS
oklchColors.light.primary  // "oklch(0.45 0.18 260)"

// hexColors - Pre-computed, used by mobile native components
hexColors.light.primary    // "#044CB6"

// rgbColors - Pre-computed, used by NativeWind CSS variables
rgbColors.light.primary    // "4 76 182"
```

### Adding Colors
1. Add to `oklchColors` in `src/theme/colors.ts`
2. Hex/RGB auto-computed at import time
3. Regenerate CSS for both platforms:
   - `pnpm --filter web generate:theme`
   - `pnpm --filter mobile generate:theme`

## Deduplication (Tier 1)

Client-side deterministic matching in `src/dedup/`:
- `tier1.ts` - Core matching logic
- `merchant-extractor.ts` - Extracts merchant names
- `jaro-winkler.ts` - String similarity

Uncertain pairs go to Tier 2 (LLM API in web app).

## Hooks

React hooks that work with `DatabaseProvider`:
```typescript
function Dashboard() {
  const { data: transactions } = useTransactions();
  const { data: recentTxns } = useRecentTransactions(5);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
}
```

## Structure

```
src/
├── index.ts            # Main exports
├── crypto/             # AES-256-GCM encryption
├── schema/             # SQLite DDL + default categories
├── types/              # TypeScript types
├── storage/            # DatabaseAdapter interface
├── utils/              # Date, color utilities
├── theme/              # Colors (oklch, hex, rgb)
├── services/           # Data access layer
├── hooks/              # React hooks
└── dedup/              # Tier 1 deduplication
```
