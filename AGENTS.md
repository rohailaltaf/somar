# AGENTS.md - AI Agent Guide for Personal Finance Tracker

## Agent Guidelines

**DO NOT do more than what is asked.** If in doubt, confirm with the user before implementing additional features, helpers, or conveniences. Stick to the specific request.

**Check shared packages before implementing inline types.** Before defining new types inline (especially union types like account types or category types), check if they already exist in `packages/shared/src/`. Shared types should be imported from `@somar/shared`:
```typescript
import type { AccountType, CategoryType } from "@somar/shared";
```

## Project Overview

A personal finance web app for **tracking spending and income**. Users can import bank/credit card CSV exports, auto-categorize transactions, and track spending against category budgets.

**Key Differentiators:**
1. Tinder-style swipe UI for quickly categorizing transactions
2. Smart CSV import with column inference
3. Learning categorization - the system learns from user corrections
4. Plaid integration for connecting financial institutions (Chase, Amex, Fidelity, Robinhood, etc.)
5. **End-to-end encryption (E2EE)** - server cannot read user financial data

> **Architecture Documentation:** For detailed technical architecture including the E2EE model, database design, and security considerations, see [docs/architecture.md](docs/architecture.md).

## Monorepo Architecture

This project uses **Turborepo** with **pnpm workspaces**:

```
somar/
├── apps/
│   ├── web/              # Next.js web application (@somar/web)
│   └── mobile/           # React Native/Expo app (@somar/mobile)
├── packages/
│   └── shared/           # Shared types and utilities (@somar/shared)
├── turbo.json            # Turborepo pipeline configuration
├── pnpm-workspace.yaml   # Defines workspace packages
├── package.json          # Root package.json (minimal, Turborepo scripts only)
└── tsconfig.base.json    # Base TypeScript config extended by packages
```

### React Version Note

Due to React Native's `react-native-renderer` being pinned to a specific React version, web and mobile use different React versions:

- **Web (`@somar/web`):** React ^19.1.4 (latest patched version)
- **Mobile (`@somar/mobile`):** React 19.1.0 (must match react-native-renderer)

Each app has its own `node_modules` with its own React version, so they can run together without conflicts.

### Running Commands

**Turborepo commands (run from root):**
```bash
pnpm dev          # Start all apps (web + mobile)
pnpm dev:web      # Start web app only
pnpm build        # Build all apps
pnpm lint         # Lint all packages
pnpm test         # Run all tests
```

**Web app commands (use --filter):**
```bash
pnpm --filter web dev           # Start web dev server
pnpm --filter web db:safe-reset # Reset database (disconnects Plaid first)
```

**Mobile app commands:**
```bash
pnpm --filter mobile dev            # Start Expo dev server
pnpm --filter mobile ios            # Start iOS simulator
pnpm --filter mobile android        # Start Android emulator
pnpm --filter mobile generate:theme # Regenerate global.css from shared theme
```

## Tech Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 16 with App Router
- **Mobile:** React Native with Expo + Expo Router
- **Central Database:** PostgreSQL via Prisma (auth, Plaid tokens)
- **User Database:** SQLite via sql.js (web) / expo-sqlite (mobile), encrypted
- **UI (Web):** shadcn/ui components + Tailwind CSS v4
- **UI (Mobile):** NativeWind (Tailwind for React Native)
- **Fonts:** DM Sans (body text) + Instrument Serif (display/numbers)
- **Animations (Web):** Framer Motion (for tagger swipe and dashboard)
- **Animations (Mobile):** react-native-reanimated + expo-haptics
- **Charts:** Recharts (for reports/analytics)
- **Financial Data:** Plaid (for bank connections)
- **Language:** TypeScript

## Shared Package (`@somar/shared`)

The shared package contains platform-agnostic code used by both web and mobile apps.

### Subpath Exports

The package uses subpath exports for tree-shaking and clean imports:

```typescript
// Main exports (types, crypto, schema, dedup, storage utils)
import { type AccountType, type CategoryType, type DatabaseAdapter } from "@somar/shared";

// Services (data access layer) - via subpath
import { getAllTransactions, confirmTransaction } from "@somar/shared/services";

// Hooks (React hooks) - via subpath
import { useTransactions, useAccounts, useCategories } from "@somar/shared/hooks";

// Theme colors - via subpath (single source of truth for all colors)
import { hexColors, oklchColors, rgbColors } from "@somar/shared/theme";

// Utilities - via subpath
import { oklchToHex, oklchToRgbTriplet } from "@somar/shared/utils";
```

### DatabaseAdapter Abstraction

Both web and mobile implement the same `DatabaseAdapter` interface:

```typescript
// packages/shared/src/storage/types.ts
export interface DatabaseAdapter {
  all<T>(sql: string, params?: SqlParam[]): T[];      // SELECT queries
  get<T>(sql: string, params?: SqlParam[]): T | undefined;  // Single row
  run(sql: string, params?: SqlParam[]): void;        // INSERT/UPDATE/DELETE
  exec(sql: string): void;                            // Raw SQL (schema creation)
}
```

**Platform Implementations:**
- **Web:** `apps/web/src/lib/storage/sql-js-adapter.ts` - wraps sql.js
- **Mobile:** `apps/mobile/src/lib/storage/expo-sqlite-adapter.ts` - wraps expo-sqlite

### Services Layer

Services are pure functions that take a `DatabaseAdapter` and perform database operations:

```typescript
// Example usage in a component
import { useDatabaseAdapter } from "@somar/shared/hooks";
import { getAllTransactions } from "@somar/shared/services";

function MyComponent() {
  const db = useDatabaseAdapter();
  const transactions = getAllTransactions(db);
  // ...
}
```

### Shared Hooks

React hooks that work on any platform with a `DatabaseProvider`:

```typescript
import { useTransactions, useRecentTransactions, useAccounts, useCategories } from "@somar/shared/hooks";

function Dashboard() {
  const { data: transactions } = useTransactions();
  const { data: recentTxns } = useRecentTransactions(5); // Optimized for dashboards
  const { data: accounts } = useAccounts();
  // ...
}
```

### Theme System

All theme colors are defined in `@somar/shared/theme` as the **single source of truth**. This ensures visual consistency across web and mobile.

**Architecture:**
```
┌─────────────────────────────────────────┐
│  @somar/shared/theme                    │
│  ─────────────────                      │
│  oklchColors (source of truth)          │
│  hexColors (pre-computed at import)     │
│  rgbColors (pre-computed at import)     │
└───────────────┬─────────────────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌──────────────┐  ┌──────────────────────┐
│  Web         │  │  Mobile              │
│  Uses oklch  │  │  generate:theme      │
│  directly in │  │  → global.css (RGB)  │
│  globals.css │  │  theme.ts → hexColors│
└──────────────┘  └──────────────────────┘
```

**Why different formats?**
- **Web (oklch):** Modern CSS color space with better perceptual uniformity
- **Mobile (RGB/hex):** React Native doesn't support oklch; NativeWind needs RGB triplets

**Color exports from `@somar/shared/theme`:**
```typescript
import { oklchColors, hexColors, rgbColors, getThemeColors } from "@somar/shared/theme";

// oklchColors - Source of truth, use in web CSS
oklchColors.light.primary  // "oklch(0.45 0.18 260)"
oklchColors.dark.background // "oklch(0.08 0.015 260)"

// hexColors - Pre-computed, use for native components
hexColors.light.primary    // "#044CB6"
hexColors.dark.success     // "#5BB661"

// rgbColors - Pre-computed, use in NativeWind CSS variables
rgbColors.light.primary    // "4 76 182"

// getThemeColors(mode) - Get all formats for a mode
const { oklch, hex, rgb } = getThemeColors("dark");
```

**Adding/modifying colors:**
1. Edit `packages/shared/src/theme/colors.ts` - add to `oklchColors`
2. Hex and RGB values are auto-computed at import time
3. Run `pnpm --filter mobile generate:theme` to regenerate mobile's `global.css`
4. Web's `globals.css` uses oklch directly (update manually if needed for web-only features)

**Mobile usage:**
```typescript
// For native components (ActivityIndicator, icons, RefreshControl)
import { themeColors } from "@/lib/theme";
import { useColorScheme } from "nativewind";

const { colorScheme } = useColorScheme();
<ActivityIndicator color={themeColors[colorScheme ?? "light"].primary} />

// For category colors (stored as oklch in DB)
import { oklchToHex } from "@somar/shared/utils";
<View style={{ backgroundColor: oklchToHex(category.color) }} />
```

## Project Structure

```
somar/
├── apps/
│   ├── web/                        # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   │   ├── page.tsx        # Dashboard - spending overview
│   │   │   │   ├── (auth)/         # Login, register, signout
│   │   │   │   ├── reports/        # Reports & analytics with charts
│   │   │   │   ├── accounts/       # Account management + Plaid connection
│   │   │   │   ├── categories/     # Category + budget management
│   │   │   │   ├── transactions/   # Transaction list with filters
│   │   │   │   ├── tagger/         # Tinder-style categorization UI
│   │   │   │   ├── upload/         # CSV import wizard
│   │   │   │   └── api/            # API routes
│   │   │   │       ├── auth/       # Better Auth endpoints
│   │   │   │       ├── db/         # Blob upload/download/init
│   │   │   │       ├── plaid/      # Plaid integration
│   │   │   │       └── dedup/      # LLM dedup verification
│   │   │   ├── providers/          # React context providers
│   │   │   │   ├── auth-provider.tsx      # Auth context (wraps Better Auth)
│   │   │   │   └── database-provider.tsx  # sql.js database + encryption
│   │   │   ├── hooks/              # Web-specific hooks
│   │   │   │   ├── use-plaid-sync.ts   # Plaid sync with dedup
│   │   │   │   └── use-plaid-items.ts  # Plaid items query
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn components
│   │   │   │   ├── nav.tsx         # Navigation bar
│   │   │   │   └── ...
│   │   │   └── lib/
│   │   │       ├── db/index.ts     # Prisma client for central DB
│   │   │       ├── dedup/          # LLM verifier (Tier 2)
│   │   │       ├── storage/        # Storage adapters
│   │   │       │   └── sql-js-adapter.ts  # sql.js → DatabaseAdapter
│   │   │       ├── auth.ts         # Better Auth config
│   │   │       ├── plaid.ts        # Plaid client configuration
│   │   │       └── csv-parser.ts   # CSV parsing + column inference
│   │   ├── prisma/
│   │   │   └── central-schema.prisma  # Central DB schema (PostgreSQL)
│   │   ├── scripts/                # Utility scripts
│   │   ├── public/                 # Static assets
│   │   ├── data/                   # Encrypted blobs (gitignored)
│   │   ├── package.json            # Web app dependencies + scripts
│   │   └── tsconfig.json           # Extends ../../tsconfig.base.json
│   └── mobile/                     # React Native/Expo app
│       ├── app/                    # Expo Router pages
│       │   ├── _layout.tsx         # Root layout (providers + font loading)
│       │   ├── index.tsx           # Entry point (redirects based on auth)
│       │   ├── (auth)/             # Auth screens (login, register)
│       │   └── (tabs)/             # Tab navigation (dashboard, transactions)
│       ├── src/
│       │   ├── components/ui/      # Shared UI components
│       │   ├── providers/          # React context providers
│       │   │   ├── auth-provider.tsx      # Auth context
│       │   │   └── database-provider.tsx  # expo-sqlite + encryption
│       │   └── lib/
│       │       ├── storage/        # Storage adapters
│       │       │   └── expo-sqlite-adapter.ts  # expo-sqlite → DatabaseAdapter
│       │       ├── auth-client.ts  # Better Auth client
│       │       ├── api.ts          # API helpers
│       │       ├── theme.ts        # Theme colors for native components (imports from @somar/shared/theme)
│       │       └── color.ts        # Re-exports color utils from @somar/shared/utils
│       ├── scripts/
│       │   └── generate-theme.ts   # Generates global.css from shared theme
│       ├── global.css              # NativeWind theme variables (auto-generated)
│       ├── tailwind.config.js      # Tailwind/NativeWind config
│       ├── app.json                # Expo config
│       ├── metro.config.js         # Metro bundler config for pnpm
│       ├── package.json            # Mobile app dependencies
│       └── tsconfig.json           # Extends expo/tsconfig.base
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts            # Shared exports (crypto, schema, types, dedup, storage)
│       │   ├── crypto/             # Encryption utilities (AES-256-GCM)
│       │   ├── schema/             # SQLite schema DDL + default categories
│       │   ├── types/              # Shared TypeScript types
│       │   ├── storage/            # Database adapter abstraction
│       │   │   ├── index.ts        # Exports
│       │   │   └── types.ts        # DatabaseAdapter interface
│       │   ├── utils/              # Shared utilities
│       │   │   ├── index.ts        # Exports
│       │   │   ├── date.ts         # Date formatting utilities
│       │   │   └── color.ts        # Color conversion (oklch → hex/RGB)
│       │   ├── theme/              # Theme system (single source of truth)
│       │   │   ├── index.ts        # Exports
│       │   │   └── colors.ts       # All theme colors in oklch + pre-computed hex/RGB
│       │   ├── services/           # Data access layer (platform-agnostic)
│       │   │   ├── index.ts        # Exports all services
│       │   │   ├── transactions.ts # Transaction queries + categorization
│       │   │   ├── accounts.ts     # Account queries
│       │   │   └── categories.ts   # Category queries
│       │   ├── hooks/              # Shared React hooks
│       │   │   ├── index.ts        # Exports all hooks
│       │   │   ├── database-context.tsx   # DatabaseAdapter context
│       │   │   ├── use-transactions.ts    # Transaction hooks
│       │   │   ├── use-accounts.ts        # Account hooks
│       │   │   └── use-categories.ts      # Category hooks
│       │   └── dedup/              # Transaction deduplication (Tier 1 - client-side)
│       │       ├── index.ts        # Public exports
│       │       ├── types.ts        # Shared type definitions
│       │       ├── tier1.ts        # Deterministic matching logic
│       │       ├── merchant-extractor.ts  # Extracts merchant names
│       │       ├── jaro-winkler.ts # String similarity algorithms
│       │       └── batch-utils.ts  # Batching utilities
│       ├── package.json
│       └── tsconfig.json           # Extends ../../tsconfig.base.json
├── docs/                           # Documentation
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # Workspace packages
├── package.json                    # Root (Turborepo scripts only)
├── tsconfig.base.json              # Base TypeScript config
├── AGENTS.md                       # This file
├── README.md                       # Project README
└── LICENSE
```

## Database Schema

The app uses a **two-database model** for E2EE:

### Central Database (PostgreSQL - Server)

Stores only what the server needs. Schema at `apps/web/prisma/central-schema.prisma`:

- **users** - Email, name, encryption salt (Better Auth)
- **sessions** - Active sessions with device tracking
- **accounts** - OAuth accounts (Google, etc.)
- **plaid_items** - Plaid connections with access tokens
- **plaid_account_meta** - Minimal Plaid account info for syncing
- **encrypted_databases** - Blob metadata (version, size)
- **pending_plaid_syncs** - Queue for encrypted Plaid data

### User Database (SQLite - Browser)

Each user has an encrypted SQLite database that runs **entirely in the browser** via sql.js. Schema defined in `packages/shared/src/schema/index.ts`:

**accounts**
- `id` (text, PK), `name`, `type` (checking | credit_card | investment | loan), `created_at`, `plaid_account_id` (nullable)

**categories**
- `id` (text, PK), `name`, `type` (spending | income | transfer), `color` (oklch color), `created_at`
- `type`: "spending" for expenses, "income" for income streams, "transfer" for money movements
- Default categories defined in `packages/shared/src/schema/index.ts`

**category_budgets**
- `id`, `category_id` (FK), `amount` (real), `start_month` (YYYY-MM), `created_at`
- Historical budget tracking - budgets apply from start_month onwards until changed
- **Budgets only apply to spending categories**

**transactions**
- `id`, `account_id` (FK), `category_id` (FK, nullable), `description`, `amount` (real), `date` (YYYY-MM-DD), `excluded` (boolean), `is_confirmed` (boolean), `created_at`, `plaid_transaction_id` (unique, nullable)
- `amount`: **negative = expense (money out), positive = income/credit (money in)**
- `excluded`: if true, not counted in spending calculations
- `is_confirmed`: false until user confirms category in tagger
- Additional Plaid fields: `plaid_original_description`, `plaid_name`, `plaid_merchant_name`, `plaid_authorized_date`, `plaid_posted_date`

**categorization_rules**
- `id`, `pattern` (text), `category_id` (FK), `is_preset` (boolean), `created_at`
- Stores merchant patterns for auto-categorization
- Learned rules take priority over preset rules

**plaid_sync_state**
- `item_id` (PK), `cursor`, `last_synced_at`
- Stores sync cursor client-side (not on server) for data integrity

## Key Features

### 1. Auto-Categorization (`packages/shared/src/services/transactions.ts`)

- Matches transaction descriptions against stored patterns
- Priority: learned rules > preset rules
- Matching order: exact match > starts with > contains
- Learning: when user confirms a category, extracts merchant pattern and saves as new rule

**Pattern Extraction Logic:**
The `extractMerchantPattern()` function extracts a **short, general pattern** from transaction descriptions:

1. Removes common prefixes: "PURCHASE ", "POS ", "DEBIT ", "ACH ", etc.
2. **Removes transaction type suffixes**: "PAYROLL", "DIR DEP", "PPD", "WEB", etc.
   - This is critical! Same merchant can appear as "ACME PAYROLL" and "ACME DIR DEP"
   - Pattern should be just "ACME" to match both
3. Removes trailing IDs, dates, reference numbers
4. Truncates to ~3 words if still too long

**Example:**
- Input: `"ACME CORP PAYROLL PPD ID: 1234567890"`
- Extracted pattern: `"ACME CORP"`
- This matches both `"ACME CORP PAYROLL..."` and `"ACME CORP DIR DEP..."`

**Auto-Tagging Flow:**
When a transaction is confirmed via `confirmTransaction()`:
1. Transaction is marked as confirmed with the selected category
2. Pattern is learned via `learnCategorizationPattern()`
3. **Hybrid recategorization** for performance:
   - **Immediate:** Recategorize only visible transactions (IDs passed from client) - fast, ~50 transactions
   - **Background:** Fire-and-forget for remaining unconfirmed transactions - runs after response sent
4. Returns list of updated transaction IDs so UI can reflect changes
5. **Important:** Auto-tagged transactions get the category but remain `isConfirmed: false` - humans always confirm

**Background Job Pattern:**
In Next.js server actions, not awaiting a promise allows it to continue after response:
```typescript
// IMMEDIATE: await this, return results to client
const updates = await recategorizeVisibleTransactions(visibleIds);

// BACKGROUND: don't await - runs after response sent
recategorizeRemainingTransactions(visibleIds).catch(() => {});

return { updatedTransactions: updates };
```

### 2. Tagger (`apps/web/src/app/tagger/`)

- Shows unconfirmed transactions one at a time
- **Click any category pill to auto-confirm** - no need to click confirm button
- Swipe right / Press Y / → : Confirm suggested category
- Swipe left / Press N / ← : Skip to next
- Press E : Exclude transaction
- **Press Z : Undo last categorization** - returns transaction to unconfirmed list
- All categories shown as clickable pills
- Shows suggestion banner when pattern match found
- When you confirm a transaction, it learns the pattern and **automatically re-categorizes all remaining unconfirmed transactions**

### 3. CSV Import (`apps/web/src/app/upload/`, `apps/web/src/lib/csv-parser.ts`)

- Multi-step wizard: Select account → Upload → Map columns → **Confirm sign convention** → Review duplicates → Preview → Import
- Auto-infers column mappings (date, description, amount, debit/credit)
- **Sign convention confirmation**: Shows preview of transactions and allows user to flip signs if needed
  - Different banks use different conventions for expense signs
  - App convention: **negative = expense (money out), positive = income (money in)**
  - User can toggle "Flip all amount signs" checkbox if their bank uses opposite convention
- **AI-powered duplicate detection** - See [docs/deduplication.md](docs/deduplication.md) for full documentation
  - 2-tier system: Tier 1 (deterministic, client-side) → Tier 2 (LLM API for uncertain cases)
  - Tier 1 runs in browser using `@somar/shared/dedup`, only uncertain pairs call `/api/dedup/verify`
  - Catches duplicates even when descriptions differ (e.g., "AplPay CHIPOTLE 1249" vs "Chipotle Mexican Grill")
- Final amounts: negative = expense, positive = income

### 4. Plaid Integration (`apps/web/src/app/accounts/`, `apps/web/src/hooks/use-plaid-sync.ts`)

Connect financial institutions directly for automatic transaction syncing. **Plaid connection is integrated directly into the Accounts page** - no separate connect page.

**Supported Institutions:** Chase, Amex, Fidelity, Robinhood, and 12,000+ others

**E2EE Architecture - Server Proxy Pattern:**
With E2EE, transactions are stored in the user's encrypted SQLite database. The server acts as a proxy:
1. Server calls Plaid API (has access token)
2. Server returns raw transactions to client
3. Client runs deduplication, inserts transactions, encrypts and saves

**Connection Flow:**
1. User clicks "Connect Bank" button on `/accounts` page
2. Plaid Link widget opens (handled by `react-plaid-link`)
3. User authenticates with their bank
4. Backend exchanges public token for access token (stored in central DB)
5. Creates accounts in user's local encrypted SQLite
6. Auto-sync starts with retry logic

**Accounts Page Features:**
- **Add Manual Account:** For CSV imports
- **Connect Bank:** Opens Plaid Link for automatic syncing
- **Connected Institutions Section:** Shows all Plaid connections with sync/disconnect buttons
- **Manage Accounts:** Opens Plaid Link in update mode to add/remove accounts from existing connection
- **Manual Accounts Section:** Shows manually created accounts

**Sync Behavior:**
- **Auto-sync on connect:** After connecting, waits for Plaid to fetch historical data with retry logic
- **Auto-sync on login:** Items not synced in 1+ hour are synced automatically via `AutoSync` component
- **Manual sync:** "Sync" button per institution on `/accounts` page
- **Client-side cursor:** Stored in `plaid_sync_state` table in user's encrypted DB (not on server)
- **Deduplication:** 2-tier system (Tier 1 client-side via `@somar/shared/dedup`, Tier 2 via `/api/dedup/verify`)
- **Skip pending:** Pending transactions are not imported - synced when posted
- All synced transactions start as `isConfirmed: false`

**Initial Sync Retry Logic:**
Plaid needs time to fetch and enrich historical data after initial connection. The server endpoint retries:
- Up to 8 retries with exponential backoff (2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s)
- Checks for enrichment (transactions have `authorized_date`)
- Also retries if no transactions returned yet

**Historical Transaction Limits:**
- We request **730 days (2 years)** of history via `transactions.days_requested`
- Default without this setting is only 90 days!
- **Cannot extend history for existing connections** - must disconnect and reconnect
- Actual history depends on what the bank provides (some only give 90 days)

**Key Files:**
```
apps/web/src/hooks/use-plaid-sync.ts       # Client-side sync hook (runs Tier 1 dedup locally)
apps/web/src/app/api/plaid/sync/route.ts   # Server proxy with retry logic
apps/web/src/app/api/dedup/verify/route.ts # LLM-only dedup verification (Tier 2)
apps/web/src/components/auto-sync.tsx      # Auto-sync on page load
packages/shared/src/dedup/                 # Tier 1 dedup (client-side, used by web + mobile)
packages/shared/src/services/transactions.ts # Transaction service (shared between web + mobile)
```

**API Routes:**
- `POST /api/plaid/create-link-token` - Generate link token
- `POST /api/plaid/update-link-token` - Generate link token for update mode
- `POST /api/plaid/exchange-token` - Exchange public token, create accounts
- `POST /api/plaid/sync` - Server proxy for transactionsSync (with retry logic)
- `POST /api/dedup/verify` - LLM verification for uncertain pairs (max 100 pairs per request)

**Client-Side Sync Hook** (`usePlaidSync`):
```typescript
const { syncItem, syncAllItems, isSyncing, syncStatus } = usePlaidSync();

// Sync a single Plaid item
const result = await syncItem(plaidItemId);
// Returns: { added, modified, removed, upgraded, errors, requiresReauth }
```

**Environment Variables:**
```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox  # or production
OPENAI_API_KEY=your_key  # For LLM deduplication (optional)
```

**Testing:**
- Use Plaid Sandbox with test credentials
- Test user: `user_good` / `pass_good` for successful auth

### 5. Budget Tracking

- Budgets have a `start_month` - applies from that month forward
- Historical queries use the budget that was active at that time
- Dashboard shows spending vs budget with progress bars
- **Only spending categories have budgets** - income categories don't need budgets

### 6. Category Types (Spending vs Income vs Transfer)

- **Spending categories**: Track expenses with budgets (restaurant, groceries, etc.)
- **Income categories**: Track income streams without budgets (job income, freelance, etc.)
- **Transfer categories**: Track money movements without budgets (transfers, credit card payments, etc.)
  - Transfer transactions are **automatically excluded** from all spending and income reports
  - When a transaction is categorized as a transfer, `excluded` is set to `true`
- Categories page shows tabs for Spending, Income, and Transfers
- `getCategories(type?: "spending" | "income" | "transfer")` filters by type
- `getCategoriesWithBudgets()` only returns spending categories
- Transactions with **negative amounts are expenses, positive amounts are income**

### 7. Reports & Analytics (`apps/web/src/app/reports/`)

**Philosophy:** Keep it simple and focused. Start with one useful report, iterate based on actual needs.

**Structure:**
- Landing page (`/reports`) - Grid of report cards
- Individual report pages (`/reports/spending-overview`) - Server + client component pattern
- No API routes needed for simple reports - server actions are sufficient

**Spending Overview Report** (`/reports/spending-overview`)
1. **Total Spending Card**: Big number showing current month total with change vs last month
2. **Burn-up Chart**: Line chart showing cumulative daily spending (this month vs last month)
3. **Category Progress Bars**: Spending vs budget for each category (reuses BudgetProgress component)

**Analytics Functions** (in `packages/shared/src/services/transactions.ts`, imported via `@somar/shared/services`):
```typescript
// Get daily cumulative spending for a month (for burn-up chart)
getDailyCumulativeSpending(db: DatabaseAdapter, month: string)
// Returns: [{ day: 1, date: "2024-01", cumulative: 150 }, ...]

// Get recent transactions with limit (optimized for dashboards)
getRecentTransactions(db: DatabaseAdapter, limit: number)
// Returns: TransactionWithRelations[] (uses database LIMIT, O(1) performance)

// Existing functions used:
getTotalSpending(db: DatabaseAdapter, month: string)
getSpendingByCategory(db: DatabaseAdapter, month: string)
```

**Chart Library: Recharts**
- Install: `pnpm --filter web add recharts`
- Use LineChart for burn-up visualization
- Custom tooltips for currency formatting
- Keep it simple - avoid over-engineering with too many chart types

**Performance:**
- Server-side aggregation using SQL GROUP BY
- Leverages existing database indexes on `date` and `excluded`
- All data fetched in parallel with Promise.all
- No pagination needed for monthly data (max 31 days)

## Important Patterns

### Date Handling
- Store dates as `YYYY-MM-DD` strings
- Parse without timezone conversion to avoid day shifts:
```typescript
const [year, month, day] = dateStr.split("-").map(Number);
const date = new Date(year, month - 1, day);
```

### Amount Convention
- **Negative = expense/debit (money out)** - displayed in red
- **Positive = income/credit (money in)** - displayed in green
- This is enforced throughout the codebase (`amount < 0` filters for expenses)

### API Routes Pattern
- Business logic lives in `apps/web/src/lib/` (e.g., `lib/plaid.ts`, `lib/dedup/`)
- API routes in `apps/web/src/app/api/` handle HTTP concerns and call lib functions
- Call `revalidatePath()` after mutations to refresh data

### Current Month Calculation
```typescript
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
```

## Environment Configuration

The project supports separate development and production environments.

### Environment Files

Environment files live in `apps/web/`:
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- `.env.example` - Template for environment configuration (committed to git)

Key variables:
```bash
# Central Database (PostgreSQL)
CENTRAL_DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Plaid
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
PLAID_ENV="sandbox"

# Storage (for encrypted blobs)
STORAGE_TYPE="filesystem"
DATA_DIR="./data"
```

### Running in Different Environments

```bash
# Development (uses .env.development)
pnpm dev                    # Start all apps (web + mobile)
pnpm dev:web                # Start web only

# Production (uses .env.production)
pnpm build                  # Build for production
pnpm --filter web start     # Start production server
```

### Database Commands

All database commands are for the **central PostgreSQL database** (not user data, which is client-side):

```bash
# Development
pnpm --filter web db:push          # Push schema changes to central DB
pnpm --filter web db:studio        # Open Prisma Studio for central DB
pnpm --filter web db:safe-reset    # Disconnect Plaid + reset central DB

# Production
pnpm --filter web db:push:prod     # Push schema changes to prod central DB
pnpm --filter web db:studio:prod   # Open Prisma Studio (prod)
pnpm --filter web db:safe-reset:prod # Safe reset prod
```

## Common Tasks

### Reset Database
```bash
# RECOMMENDED: Safe reset (disconnects Plaid, then resets)
pnpm --filter web db:safe-reset       # Safe reset development database
pnpm --filter web db:safe-reset:prod  # Safe reset production database

# UNSAFE: Reset without disconnecting Plaid (not recommended if you have connections!)
pnpm --filter web db:reset            # Reset dev database (doesn't disconnect Plaid!)
pnpm --filter web db:reset:prod       # Reset prod database (doesn't disconnect Plaid!)
```

**Safe reset** disconnects all Plaid items, deletes the central DB file, and recreates the Prisma schema.

**⚠️ Important:** Always use `db:safe-reset` instead of `db:reset` if you have Plaid connections, otherwise you'll be billed for orphaned items!

### Add New Category

Default categories are defined in `packages/shared/src/schema/index.ts` in the `DEFAULT_CATEGORIES` array. These are seeded when a new user database is created client-side.

Example:
```typescript
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "restaurant", type: "spending", color: "oklch(0.65 0.2 30)" },
  { name: "job income", type: "income", color: "oklch(0.7 0.2 140)" },
  { name: "transfers", type: "transfer", color: "oklch(0.5 0.08 220)" },
  // ...
];
```

Users can also add custom categories via the Categories page in the app.

### Modify User Data Schema
1. Edit `packages/shared/src/schema/index.ts` (the `SCHEMA_SQL` constant)
2. Note: Schema changes require users to create a new database (no migrations for client-side SQLite)

### Modify Central Database Schema
1. Edit `apps/web/prisma/central-schema.prisma`
2. Run `pnpm --filter web db:push` to sync schema changes

### Add New Report

**Step 1:** Add a card to `/reports` landing page
```typescript
<Link href="/reports/your-report">
  <Card>
    <CardHeader>
      <CardTitle>Your Report Name</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>Brief description</CardDescription>
    </CardContent>
  </Card>
</Link>
```

**Step 2:** Create analytics function in `packages/shared/src/services/transactions.ts`
```typescript
export function getYourData(db: DatabaseAdapter): YourDataType[] {
  return db.all<YourDataType>(
    `SELECT /* your fields */
     FROM transactions
     WHERE /* your conditions */
     GROUP BY /* your grouping */`
  );
}
```

**Step 3:** Create report page at `apps/web/src/app/reports/your-report/page.tsx`
- Server component fetches data with Suspense
- Pass to client component for charts/interactivity
- See `spending-overview` as reference

**Tips:**
- Start simple - one clear insight per report
- Aggregate data in database, not JavaScript
- Use existing indexes (date, categoryId, accountId, excluded)
- Only query expenses: `sql\`${transactions.amount} > 0\``
- Exclude excluded transactions: `eq(transactions.excluded, false)`
- Avoid over-engineering - add features only when needed

## Commands Reference

### Root Commands (Turborepo)

```bash
pnpm dev              # Start all apps (web + mobile)
pnpm dev:web          # Start web app only
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm test             # Run all tests
```

### Web App Commands

```bash
# Development
pnpm --filter web dev           # Start dev server
pnpm --filter web db:push       # Push central DB schema
pnpm --filter web db:studio     # Open Prisma Studio (central DB)
pnpm --filter web db:safe-reset # Safe reset (disconnect Plaid + reset central DB)

# Production
pnpm --filter web build              # Build for production
pnpm --filter web start              # Start production server
pnpm --filter web db:push:prod       # Push schema to prod central DB
pnpm --filter web db:studio:prod     # Open Prisma Studio (prod)
pnpm --filter web db:safe-reset:prod # Safe reset prod

# Plaid Management
pnpm --filter web plaid:status       # Check Plaid connection status (dev)
pnpm --filter web plaid:status:prod  # Check Plaid connection status (prod)

# Testing
pnpm --filter web test          # Run tests
pnpm --filter web test:watch    # Run tests in watch mode

# Other
pnpm --filter web db:generate   # Generate Prisma Client for central DB
pnpm --filter web lint          # Run ESLint
```

## Files to Ignore

- `apps/web/data/` - Encrypted user database blobs
- `apps/web/.next/` - Next.js build cache
- `.turbo/` - Turborepo cache
- `node_modules/` - At all levels (root, apps, packages)
- `apps/web/node_modules/.prisma/` - Generated Prisma Client

## Performance Optimization

### Database Indexes (CRITICAL!)

**The transactions table MUST have indexes** - without them, every query does a full table scan which is catastrophically slow even with just 1,000 transactions.

**Required indexes** (defined in `packages/shared/src/schema/index.ts`):
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_confirmed ON transactions(is_confirmed);
```

**Impact:** Query time from 500ms → 0.002ms (250x faster!)

### Server-Side Pagination

**NEVER fetch all transactions on page load** - even 1,000 transactions will cause 700-900ms render times due to:
1. Large data serialization in SSR
2. Huge HTML payload
3. Slow React hydration
4. Browser DOM performance with 1,000+ table rows

**Solution:** Use API routes with pagination (`/api/transactions`)
- Fetch only 50 transactions at a time
- Filter and paginate on the database (uses indexes)
- Load data client-side after initial page render

**Pattern:**
```typescript
// Server Component: Load minimal metadata only
const [accounts, categories] = await Promise.all([
  getAccounts(),    // ~10 rows
  getCategories(),  // ~10 rows
]);

// Client Component: Load transactions via API with pagination
const response = await fetch(`/api/transactions?page=1&limit=50`);
```

### Query Optimization

**USE:** SQL JOINs to fetch related data in a single query:
```typescript
// Optimized - single query with joins (uses DatabaseAdapter)
const rows = db.all<TransactionRow>(
  `SELECT
     t.*,
     c.id as cat_id, c.name as cat_name, c.color as cat_color,
     a.id as acc_id, a.name as acc_name, a.type as acc_type
   FROM transactions t
   LEFT JOIN categories c ON t.category_id = c.id
   LEFT JOIN accounts a ON t.account_id = a.id
   ORDER BY t.date DESC`
);
```

### Transactions Page Architecture

1. **Initial render:** Only load accounts + categories (fast ~200ms)
2. **After mount:** Fetch first page of transactions via API
3. **Filtering:** Server-side via API (uses database indexes)
4. **Pagination:** Server-side, 50 rows per page

**Expected Performance:**
- Initial page load: < 200ms
- API requests: 5-20ms
- Filter changes: Instant dropdown + fast API call
- Pagination: Instant client-side navigation + fast API call

### Performance Benchmarks

With 871 transactions:
- **Query with indexes:** 2-5ms
- **API response time:** 5-20ms  
- **Initial page render:** 200ms (only metadata)
- **Renders 50 rows:** Instant (vs 700ms for 871 rows)

With 10,000+ transactions, performance remains the same due to server-side pagination.

## Gotchas

1. **Timezone issues**: Always use local date construction, never `new Date(dateString).toISOString()`
2. **Two databases**: Central DB (PostgreSQL) is server-side for auth/Plaid. User data is client-side SQLite via sql.js.
3. **Amount signs**: Different banks use different sign conventions. The upload wizard includes a sign confirmation step where users can flip signs if needed. App convention: **negative = expense (money out), positive = income (money in)**.
4. **Category budgets**: Query must filter by `start_month <= targetMonth` and take most recent. **Only spending categories have budgets** - income and transfer categories don't need budgets.
5. **Duplicate detection**: Only checks against existing DB records, not within CSV itself (intentional - allows legitimate duplicate transactions like buying pizza twice)
6. **Missing indexes = disaster**: Always add indexes to frequently queried columns (date, category_id, account_id, etc.). Indexes are defined in `packages/shared/src/schema/index.ts`.
7. **Chart data formatting**: Recharts expects specific data structures - test with empty datasets to avoid rendering errors
8. **Month calculations**: Use helper functions (`getPreviousMonth`) to avoid off-by-one errors with month arithmetic
9. **Feature creep**: Resist adding features "just in case" - build what's needed, iterate based on actual use
10. **Category types**: When querying categories for budget management, filter by `type = 'spending'`. Transfer transactions are automatically excluded from all spending and income reports.
11. **Pattern extraction too specific**: If auto-tagging isn't working, check if the extracted pattern is too specific. Transaction descriptions from same merchant often have different suffixes (PAYROLL vs DIR DEP vs ACH). The pattern should extract just the merchant identifier, not the full description.
12. **Always use `confirmTransaction()` for category changes**: The transactions page dropdown and tagger both use `confirmTransaction()` which learns patterns and auto-tags.
13. **Plaid orphan items = wasted money**: If you reset the database without calling `itemRemove()` on Plaid, those items remain active and you'll be billed! Always use `pnpm --filter web db:safe-reset`. To check for orphans, use `pnpm --filter web plaid:status` or visit dashboard.plaid.com.
14. **Monorepo commands**: Remember to use `pnpm --filter web` for web-specific commands. Root `pnpm dev` runs all apps.
15. **React version mismatch**: Web uses React ^19.1.4 (patched), Mobile uses React 19.1.0 (must match react-native-renderer). Each app has its own node_modules, so they run together without conflicts.
16. **Mobile needs explicit @expo/metro-runtime**: Due to pnpm's symlink structure, `@expo/metro-runtime` must be listed as an explicit dependency in mobile's package.json.
17. **Encryption key from password**: The encryption key is derived from the user's password. If password is forgotten, data is unrecoverable (by design).
18. **Mobile theme colors for native components**: Some React Native components (`ActivityIndicator`, Lucide icons, `RefreshControl`) don't accept `className` and need raw color strings. Use `themeColors` from `apps/mobile/src/lib/theme.ts` with `useColorScheme()` from NativeWind. Colors come from `@somar/shared/theme`.
19. **OKLCH color conversion for mobile**: Category colors are stored as OKLCH strings but mobile native components need hex values. Use `oklchToHex()` from `@somar/shared/utils` to convert category colors when rendering outside NativeWind.
20. **Theme colors are in `@somar/shared/theme`**: All colors are defined once in `packages/shared/src/theme/colors.ts`. When adding colors: (1) add to `oklchColors`, (2) run `pnpm --filter mobile generate:theme` to regenerate mobile CSS. Don't manually edit `apps/mobile/global.css` - it's auto-generated.

## Additional Documentation

Detailed documentation for specific subsystems:

| File | Description |
|------|-------------|
| [docs/design-system.md](docs/design-system.md) | Visual design system for dashboard screens (colors, typography, animations, components) |
| [docs/deduplication.md](docs/deduplication.md) | AI-powered transaction deduplication system (2-tier: deterministic + LLM) |
