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
oklchColors.primary  // "oklch(0.65 0.18 260)"

// hexColors - Pre-computed, used by mobile native components
hexColors.primary    // "#488bfb"

// rgbColors - Pre-computed, used by NativeWind CSS variables
rgbColors.primary    // "72 139 251"

// staticColors - Charts, sidebar, danger variants
staticColors.chart1  // "oklch(0.65 0.2 260)"

// All colors combined
allHexColors, allRgbColors, allOklchColors
```

### Adding Colors
1. Add to the appropriate object in `src/theme/colors.ts`:
   - `oklchColors` for core semantic colors
   - `extendedColors` for muted variants
   - `staticColors` for charts, sidebar, danger
2. Hex/RGB auto-computed at import time
3. Regenerate CSS for both platforms:
   ```bash
   pnpm generate:theme  # Single command updates both
   ```

## UI Logic Hooks

Shared calculation and formatting logic in `@somar/shared/ui-logic`:

```typescript
import {
  useBudgetProgress,
  useAmountDisplay,
  useDateSection,
  groupByDate,
} from "@somar/shared/ui-logic";

// Budget progress - used by both web's BudgetProgress and mobile's CategoryRow
const { percentCapped, colorToken, isOverBudget, hasBudget } = useBudgetProgress(spent, budget);

// Amount display - formatting and color logic
const { display, colorClass, isExpense } = useAmountDisplay(amount, { showSign: true });

// Date section - for grouping transactions by date
const { primary, secondary, isToday } = useDateSection("2025-01-15");

// Group items by date
const groups = groupByDate(transactions, (tx) => tx.date);
```

**Color tokens returned:**
- `useBudgetProgress` returns: `primary`, `warning`, `destructive`
- `useAmountDisplay` returns: `expense`, `income`, `neutral`

These hooks ensure identical calculation logic across web and mobile.

## Component Contracts

Shared prop interfaces in `@somar/shared/components`:

```typescript
import type {
  BudgetRowProps,
  TransactionRowProps,
  EmptyStateProps,
  AmountDisplayProps,
  SectionHeaderProps,
  DateSectionHeaderProps,
  PageHeaderProps,
} from "@somar/shared/components";

// Components implement these contracts for consistent APIs
function BudgetRow(props: BudgetRowProps) { ... }
function EmptyState(props: EmptyStateProps) { ... }
```

**Available contracts:**
- `BudgetRowProps` - Category spending vs budget display
- `TransactionRowProps` - Transaction list item
- `EmptyStateProps` - No data placeholder
- `AmountDisplayProps` - Currency amount with colors
- `SectionHeaderProps` - Generic section header
- `DateSectionHeaderProps` - Date-grouped section header
- `PageHeaderProps` - Page title and actions

Contracts define the API; each platform implements rendering with its own UI toolkit.

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
