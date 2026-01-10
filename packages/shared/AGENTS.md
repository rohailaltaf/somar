# Shared Package (@somar/shared)

Platform-agnostic code used by both web and mobile. Contains types, services, hooks, theme, and utilities.

## Subpath Exports

```typescript
// Main exports
import type { AccountType, CategoryType } from "@somar/shared";

// Services (API calls - all async)
import { getAllTransactions, confirmTransaction } from "@somar/shared/services";

// Hooks
import { useTransactions, useAccounts, useCategories } from "@somar/shared/hooks";

// API client
import { configureApiClient, apiRequest, apiGet, apiPost } from "@somar/shared/api-client";

// Theme
import { hexColors, oklchColors, rgbColors } from "@somar/shared/theme";

// Utilities
import { oklchToHex, formatDate } from "@somar/shared/utils";
```

## API Client

The shared API client is configured per-platform:

```typescript
// packages/shared/src/api-client/index.ts
export interface ApiClientConfig {
  baseUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>> | Record<string, string>;
}

export function configureApiClient(config: ApiClientConfig);
export function apiRequest<T>(path: string, options?: RequestInit): Promise<T>;
export function apiGet<T>(path: string): Promise<T>;
export function apiPost<T>(path: string, body?: unknown): Promise<T>;
```

Web configuration (same-origin, cookies automatic):
```typescript
configureApiClient({
  baseUrl: "",
  getAuthHeaders: () => ({}),
});
```

Mobile configuration (cross-origin, manual cookies):
```typescript
configureApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  getAuthHeaders: async () => {
    const cookies = await authClient.getCookie();
    return cookies ? { Cookie: cookies } : {};
  },
});
```

## Services Layer

Services call the API and return typed data. All services are async:

```typescript
// packages/shared/src/services/transactions.ts
export async function getAllTransactions(): Promise<TransactionWithRelations[]> {
  const response = await apiGet<ApiResponse>("/api/transactions");
  return response.data;
}

export async function confirmTransaction(id: string, categoryId: string) {
  return apiPost(`/api/transactions/${id}/confirm`, { categoryId });
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
  DateSectionHeaderProps,
  DashboardSectionHeaderProps,
} from "@somar/shared/components";

// Components implement these contracts for consistent APIs
function BudgetRow(props: BudgetRowProps) { ... }
function EmptyState(props: EmptyStateProps) { ... }
```

Contracts define the API; each platform implements rendering with its own UI toolkit.

## Deduplication (Tier 1)

Client-side deterministic matching in `src/dedup/`:
- `tier1.ts` - Core matching logic
- `merchant-extractor.ts` - Extracts merchant names
- `jaro-winkler.ts` - String similarity

Uncertain pairs go to Tier 2 (LLM API in web app).

## Hooks

React hooks that use React Query and the API client:
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
├── types/              # TypeScript types
├── utils/              # Date, color utilities
├── theme/              # Colors (oklch, hex, rgb)
├── services/           # API calls (async)
├── hooks/              # React hooks
├── api-client/         # HTTP client
└── dedup/              # Tier 1 deduplication
```
