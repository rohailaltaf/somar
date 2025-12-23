# AGENTS.md - AI Agent Guide for Personal Finance Tracker

## Project Overview

A personal finance web app for **tracking spending and income**. Users can import bank/credit card CSV exports, auto-categorize transactions, and track spending against category budgets.

**Key Differentiators:**
1. Tinder-style swipe UI for quickly categorizing transactions
2. Smart CSV import with column inference
3. Learning categorization - the system learns from user corrections
4. Plaid integration for connecting financial institutions (Chase, Amex, Fidelity, Robinhood, etc.)

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** SQLite via Prisma ORM
- **UI:** shadcn/ui components + Tailwind CSS v4
- **Font:** Lato (Google Fonts)
- **Animations:** Framer Motion (for tagger swipe)
- **Charts:** Recharts (for reports/analytics)
- **Financial Data:** Plaid (for bank connections)
- **Language:** TypeScript

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard - spending overview
│   ├── reports/           # Reports & analytics with charts
│   ├── accounts/          # Account management + Plaid connection (unified)
│   ├── categories/        # Category + budget management
│   ├── transactions/      # Transaction list with filters
│   ├── tagger/            # Tinder-style categorization UI
│   ├── upload/            # CSV import wizard
│   └── api/               # API routes
│       ├── transactions/  # Transaction pagination API
│       ├── plaid/         # Plaid API routes (link token, exchange, sync)
│       └── reports/       # Reports data API (trends, comparisons)
├── actions/               # Server Actions
│   ├── accounts.ts        # Account CRUD
│   ├── categories.ts      # Category + budget operations
│   ├── transactions.ts    # Transaction CRUD + analytics
│   └── plaid.ts           # Plaid operations (connect, sync, disconnect)
├── components/
│   ├── ui/                # shadcn components
│   ├── nav.tsx            # Navigation bar
│   ├── budget-progress.tsx # Budget progress bars
│   ├── auto-sync.tsx      # Auto-sync Plaid transactions
│   └── page-header.tsx    # Page header component
└── lib/
    ├── db/
    │   ├── index.ts       # Prisma client connection
    │   └── seed.ts        # Seed categories + preset rules
    ├── dedup/             # Transaction deduplication (see docs/deduplication.md)
    │   ├── index.ts       # Main 3-tier orchestrator
    │   ├── merchant-extractor.ts  # Merchant name extraction
    │   ├── jaro-winkler.ts        # String similarity algorithms
    │   ├── embedding-matcher.ts   # OpenAI embeddings
    │   └── llm-verifier.ts        # GPT-5-mini verification
    ├── plaid.ts           # Plaid client configuration
    ├── categorizer.ts     # Auto-categorization logic
    ├── csv-parser.ts      # CSV parsing + column inference
    └── utils.ts           # Utility functions (cn)
```

## Database Schema

### Tables

**plaid_items**
- `id` (text, PK), `access_token`, `institution_id`, `institution_name`, `cursor` (for incremental sync), `last_synced_at`, `created_at`
- Stores connected Plaid institutions
- One-to-many relationship with accounts

**accounts**
- `id` (text, PK), `name`, `type` (checking | credit_card | investment | loan), `created_at`, `plaid_item_id` (FK, nullable), `plaid_account_id` (nullable)
- `plaid_item_id` and `plaid_account_id` link to Plaid for connected accounts
- Manual accounts have null Plaid fields

**categories**
- `id` (text, PK), `name`, `type` (spending | income | transfer), `color` (oklch color), `created_at`
- `type`: "spending" for expenses, "income" for income streams, "transfer" for money movements
- Spending categories: personal, restaurant, work, house, entertainment, travel, shopping, car, grocery, subscriptions
- Income categories: job income (users can add more income streams)
- Transfer categories: transfers, credit card payments, reimbursed (excluded from spending/income reports by default)

**category_budgets**
- `id`, `category_id` (FK), `amount` (real), `start_month` (YYYY-MM), `created_at`
- Historical budget tracking - budgets apply from start_month onwards until changed
- **Budgets only apply to spending categories** - income and transfer categories don't have budgets

**transactions**
- `id`, `account_id` (FK), `category_id` (FK, nullable), `description`, `amount` (real), `date` (YYYY-MM-DD), `excluded` (boolean), `is_confirmed` (boolean), `created_at`, `plaid_transaction_id` (unique, nullable)
- `amount`: **positive = expense (money out), negative = income/credit (money in)**
- `excluded`: if true, not counted in spending calculations
- `is_confirmed`: false until user confirms category in tagger
- `plaid_transaction_id`: Plaid's transaction ID for deduplication (null for CSV imports)

**categorization_rules**
- `id`, `pattern` (text), `category_id` (FK), `is_preset` (boolean), `created_at`
- Stores merchant patterns for auto-categorization
- `is_preset`: true for built-in rules, false for learned rules
- Learned rules take priority over preset rules

## Key Features

### 1. Auto-Categorization (`src/lib/categorizer.ts`)

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

### 2. Tagger (`src/app/tagger/`)

- Shows unconfirmed transactions one at a time
- **Click any category pill to auto-confirm** - no need to click confirm button
- Swipe right / Press Y / → : Confirm suggested category
- Swipe left / Press N / ← : Skip to next
- Press E : Exclude transaction
- **Press Z : Undo last categorization** - returns transaction to unconfirmed list
- All categories shown as clickable pills
- Shows suggestion banner when pattern match found
- When you confirm a transaction, it learns the pattern and **automatically re-categorizes all remaining unconfirmed transactions**

### 3. CSV Import (`src/app/upload/`, `src/lib/csv-parser.ts`)

- Multi-step wizard: Select account → Upload → Map columns → **Confirm sign convention** → Review duplicates → Preview → Import
- Auto-infers column mappings (date, description, amount, debit/credit)
- **Sign convention confirmation**: Shows preview of transactions and allows user to flip signs if needed
  - Different banks use different conventions for expense signs
  - App convention: **positive = expense (money out), negative = income (money in)**
  - User can toggle "Flip all amount signs" checkbox if their bank uses opposite convention
- **AI-powered duplicate detection** - See [docs/deduplication.md](docs/deduplication.md) for full documentation
  - 3-tier system: Deterministic → Embeddings → LLM verification
  - Catches duplicates even when descriptions differ (e.g., "AplPay CHIPOTLE 1249" vs "Chipotle Mexican Grill")
- Final amounts: positive = expense, negative = income

### 4. Plaid Integration (`src/app/accounts/`, `src/actions/plaid.ts`)

Connect financial institutions directly for automatic transaction syncing. **Plaid connection is integrated directly into the Accounts page** - no separate connect page.

**Supported Institutions:** Chase, Amex, Fidelity, Robinhood, and 12,000+ others

**Connection Flow:**
1. User clicks "Connect Bank" button on `/accounts` page
2. Plaid Link widget opens (handled by `react-plaid-link`)
3. User authenticates with their bank
4. Backend exchanges public token for access token
5. Creates PlaidItem + Account records
6. Immediately syncs transactions

**Accounts Page Features:**
- **Add Manual Account:** For CSV imports
- **Connect Bank:** Opens Plaid Link for automatic syncing
- **Connected Institutions Section:** Shows all Plaid connections with sync/disconnect buttons
- **Manage Accounts:** Opens Plaid Link in update mode to add/remove accounts from existing connection (e.g., add Chase savings to existing Chase checking connection)
- **Manual Accounts Section:** Shows manually created accounts

**Sync Behavior:**
- **Auto-sync:** On dashboard load, items not synced in 1+ hour are synced automatically
- **Manual sync:** "Sync" button per institution on `/accounts` page
- Uses Plaid's cursor-based sync (`/transactions/sync`) for efficiency
- New transactions are auto-categorized using existing rules
- All synced transactions start as `isConfirmed: false`

**Key Functions** (in `src/actions/plaid.ts`):
```typescript
createLinkToken()              // Generate token for Plaid Link
createUpdateModeLinkToken(id)  // Generate token for update mode (manage accounts)
exchangePublicToken(...)       // Exchange for access_token, create accounts
updatePlaidItemAccounts(id)    // Sync account list, add new accounts after update mode
syncTransactionsForItem(id)    // Sync transactions for specific item
syncAllTransactions()          // Sync all connected items
getItemsNeedingSync()          // Get items not synced in 1+ hour
disconnectInstitution(id)      // Remove connection (optionally delete transactions)
```

**API Routes:**
- `POST /api/plaid/create-link-token` - Generate link token
- `POST /api/plaid/update-link-token` - Generate link token for update mode (manage accounts)
- `POST /api/plaid/exchange-token` - Exchange public token
- `POST /api/plaid/sync` - Manual sync trigger

**Environment Variables:**
```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox  # or production
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
- Transactions with **positive amounts are expenses, negative amounts are income**

### 7. Reports & Analytics (`src/app/reports/`)

**Philosophy:** Keep it simple and focused. Start with one useful report, iterate based on actual needs.

**Structure:**
- Landing page (`/reports`) - Grid of report cards
- Individual report pages (`/reports/spending-overview`) - Server + client component pattern
- No API routes needed for simple reports - server actions are sufficient

**Spending Overview Report** (`/reports/spending-overview`)
1. **Total Spending Card**: Big number showing current month total with change vs last month
2. **Burn-up Chart**: Line chart showing cumulative daily spending (this month vs last month)
3. **Category Progress Bars**: Spending vs budget for each category (reuses BudgetProgress component)

**Analytics Functions** (in `src/actions/transactions.ts`):
```typescript
// Get daily cumulative spending for a month (for burn-up chart)
getDailyCumulativeSpending(month: string)
// Returns: [{ day: 1, date: "2024-01", cumulative: 150 }, ...]

// Existing functions used:
getTotalSpending(month: string)
getSpendingByCategory(month: string)
```

**Chart Library: Recharts**
- Install: `npm install recharts`
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
- **Positive = expense/debit (money out)** - displayed in red
- **Negative = income/credit (money in)** - displayed in green
- This matches the schema.prisma comment and is enforced throughout the UI

### Server Actions
- All mutations use Next.js Server Actions in `src/actions/`
- Call `revalidatePath()` after mutations to refresh data

### Current Month Calculation
```typescript
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
```

## Environment Configuration

The project supports separate development and production environments with different databases and configuration.

### Environment Files

- `.env.development` - Development configuration (uses `finance-dev.db`)
- `.env.production` - Production configuration (uses `finance-prod.db`)
- `.env.demo` - Demo configuration (uses `finance-demo.db`) - for testing with realistic data
- `.env.example` - Template for environment configuration (committed to git)

### Running in Different Environments

```bash
# Development (uses .env.development)
npm run dev              # Start dev server with finance-dev.db

# Demo (uses .env.demo)
npm run demo             # Reset demo DB + start dev server with finance-demo.db

# Production (uses .env.production)
npm run build            # Build for production
npm run start            # Start production server with finance-prod.db
```

### Database Commands

All database commands have environment-specific variants:

```bash
# Development database (default)
npm run db:push          # Push schema changes to dev DB
npm run db:seed          # Seed dev DB
npm run db:reset         # Reset dev DB (delete + recreate + seed)
npm run db:studio        # Open Prisma Studio with dev DB

# Demo database (with realistic sample data)
npm run demo             # Reset demo DB + start dev server
npm run db:reset:demo    # Reset demo DB only (no server start)
npm run db:push:demo     # Push schema changes to demo DB
npm run db:seed:demo     # Seed demo DB with realistic data

# Production database (explicit :prod suffix)
npm run db:push:prod     # Push schema changes to prod DB
npm run db:seed:prod     # Seed prod DB
npm run db:reset:prod    # Reset prod DB (delete + recreate + seed)
npm run db:studio:prod   # Open Prisma Studio with prod DB
```

## Demo Mode

Demo mode provides a separate database with realistic sample data for testing and demonstrations without affecting development or production data.

### Running Demo Mode

```bash
npm run demo
```

This command:
1. Deletes any existing demo database
2. Creates fresh schema
3. Seeds with realistic sample data (see below)
4. Starts the Next.js dev server with demo database

### Demo Data Generated

The demo seed script (`src/lib/db/seed-demo.ts`) creates:

**Accounts (6 total):**
- 2x Checking accounts (one Plaid-connected: Chase, one manual)
- 2x Credit cards (one Plaid-connected: Amex, one manual)
- 1x Investment account (Plaid-connected: Fidelity)
- 1x Savings account (manual)

**Mock Plaid Items (3 total):**
- Chase (checking account)
- American Express (credit card)
- Fidelity Investments (401k)
- *Note: These use fake tokens and won't actually sync from Plaid APIs*

**Transactions (680+ over 12 months):**
- **Income**: Bi-monthly paychecks ($4,250 each on 7th and 22nd) + occasional freelance income
- **Recurring expenses**: 
  - Rent ($2,400/month on 1st)
  - Subscriptions (Netflix, Spotify, Adobe, etc. - 12 total)
  - Utilities (PG&E, Comcast)
- **Variable expenses**:
  - Groceries: 8-12 transactions/month ($25-250 each)
  - Restaurants: 10-15 transactions/month ($8-75 each)
  - Shopping: 3-8 transactions/month ($15-350 each)
  - Car/Gas: 4-6 transactions/month ($35-85 each)
  - Entertainment: 2-4 transactions/month ($12-65 each)
  - Travel: Occasional ($15-450 each)
- **Credit card payments**: Monthly payments on 25th ($1,500-3,500)
- **Mix**: ~80% confirmed, ~20% unconfirmed (for testing tagger)
- **Realistic descriptions**: Match real bank formats (e.g., "POS CHIPOTLE #1249 SAN FRANCISCO CA")

**Budgets:**
- Set for all spending categories (restaurant: $500, grocery: $600, house: $2,000, etc.)
- Start date: 12 months ago for historical tracking

### Demo Database Location

- File: `finance-demo.db` (in project root)
- Config: `.env.demo`
- Completely separate from `finance-dev.db` and `finance-prod.db`

### Use Cases

- Testing features without polluting development data
- Demonstrating the app to others
- Verifying reports with realistic data patterns
- Testing tagger with unconfirmed transactions
- Benchmarking performance with substantial data

**See [DEMO.md](DEMO.md) for complete demo mode documentation.**

## Common Tasks

### Reset Database
```bash
npm run db:reset         # Reset development database
npm run db:reset:prod    # Reset production database
```
Deletes DB files, recreates schema, seeds categories + preset rules.

### Add New Category

Add to `src/lib/db/seed.ts` in `defaultCategories` array with type and color, then run `npm run db:seed`.

Example:
```typescript
const defaultCategories = [
  { name: "restaurant", type: "spending" },
  { name: "job income", type: "income" },
  { name: "transfers", type: "transfer" },
  // ...
];

const categoryColors: Record<string, string> = {
  restaurant: "oklch(0.65 0.2 30)",
  "job income": "oklch(0.7 0.2 140)",
  transfers: "oklch(0.5 0.08 220)",
  // ...
};
```

### Add Preset Categorization Rules
Add to `presetRules` array in `src/lib/db/seed.ts`:
```typescript
{ pattern: "MERCHANT NAME", category: "category_name" }
```

### Modify Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to sync schema changes (or `npm run db:reset` to recreate from scratch)

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

**Step 2:** Create analytics function in `src/actions/transactions.ts`
```typescript
export async function getYourData() {
  const result = await db
    .select({ /* your fields */ })
    .from(transactions)
    .where(/* your conditions */)
    .groupBy(/* your grouping */);
  return result;
}
```

**Step 3:** Create report page at `src/app/reports/your-report/page.tsx`
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

## NPM Scripts

```bash
# Development (uses .env.development)
npm run dev           # Start dev server with finance-dev.db
npm run db:push       # Push schema to dev DB
npm run db:studio     # Open Prisma Studio (dev DB)
npm run db:seed       # Seed dev DB
npm run db:reset      # Reset dev DB (WARNING: doesn't disconnect Plaid!)
npm run db:safe-reset # Disconnect Plaid items, then reset dev DB (RECOMMENDED)

# Demo (uses .env.demo - realistic sample data)
npm run demo          # Reset demo DB + start dev server
npm run db:reset:demo # Reset demo DB only (no server start)
npm run db:push:demo  # Push schema to demo DB
npm run db:seed:demo  # Seed demo DB with realistic data

# Production (uses .env.production)
npm run build         # Build for production
npm run start         # Start production server
npm run db:push:prod  # Push schema to prod DB
npm run db:studio:prod # Open Prisma Studio (prod DB)
npm run db:seed:prod  # Seed prod DB
npm run db:reset:prod # Reset prod DB (WARNING: doesn't disconnect Plaid!)
npm run db:safe-reset:prod # Disconnect Plaid items, then reset prod DB (RECOMMENDED)

# Plaid Management
npm run db:disconnect-plaid      # Disconnect all Plaid items (dev)
npm run db:disconnect-plaid:prod # Disconnect all Plaid items (prod)

# Common
npm run db:generate   # Generate Prisma Client
npm run lint          # Run ESLint
```

## Files to Ignore

- `finance-dev.db`, `finance-dev.db-wal`, `finance-dev.db-shm` - Development SQLite database
- `finance-demo.db`, `finance-demo.db-wal`, `finance-demo.db-shm` - Demo SQLite database
- `finance-prod.db`, `finance-prod.db-wal`, `finance-prod.db-shm` - Production SQLite database
- `.next/` - Next.js build cache
- `node_modules/@prisma/` - Generated Prisma Client

## Performance Optimization

### Database Indexes (CRITICAL!)

**The transactions table MUST have indexes** - without them, every query does a full table scan which is catastrophically slow even with just 1,000 transactions.

**Required indexes:**
```prisma
// In prisma/schema.prisma, Transaction model:
@@index([date], name: "transactions_date_idx")
@@index([accountId], name: "transactions_account_idx")
@@index([categoryId], name: "transactions_category_idx")
@@index([date, excluded], name: "transactions_date_excluded_idx")
@@index([isConfirmed], name: "transactions_is_confirmed_idx")
```

**Impact:** Query time from 500ms → 0.002ms (250x faster!)

### SQLite Configuration

The database connection in `src/lib/db/index.ts` includes performance pragmas:
```typescript
sqlite.pragma("journal_mode = WAL");      // Write-Ahead Logging
sqlite.pragma("synchronous = NORMAL");    // Faster writes (safe with WAL)
sqlite.pragma("cache_size = -64000");     // 64MB cache
sqlite.pragma("temp_store = MEMORY");     // Temp tables in RAM
sqlite.pragma("mmap_size = 30000000000"); // Memory-mapped I/O
```

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

**USE:** Prisma's `include` or `select` for relations
```typescript
// Optimized - single query with joins
db.transaction.findMany({
  include: {
    category: true,
    account: true,
  },
});

// Or use select for specific fields
db.transaction.findMany({
  select: {
    id: true,
    amount: true,
    category: { select: { name: true, color: true } },
  },
});
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
2. **SQLite connection caching**: Dev server may hold DB connection; restart after `db:reset`
3. **Amount signs**: Different banks use different sign conventions. The upload wizard includes a sign confirmation step where users can flip signs if needed. App convention: **positive = expense (money out), negative = income (money in)**.
4. **Category budgets**: Query must filter by `start_month <= targetMonth` and take most recent. **Only spending categories have budgets** - income and transfer categories don't need budgets.
5. **Duplicate detection**: Only checks against existing DB records, not within CSV itself (intentional - allows legitimate duplicate transactions like buying pizza twice)
6. **Missing indexes = disaster**: Always add indexes to frequently queried columns (date, category_id, account_id, etc.)
7. **Large datasets in SSR**: Never serialize 1,000+ rows in server components - use API routes with pagination instead
8. **Chart data formatting**: Recharts expects specific data structures - test with empty datasets to avoid rendering errors
9. **Month calculations**: Use helper functions (`getPreviousMonth`) to avoid off-by-one errors with month arithmetic
10. **Feature creep**: Resist adding features "just in case" - build what's needed, iterate based on actual use
11. **Category types**: When querying categories for budget management, use `getCategoriesWithBudgets()` which only returns spending categories. Use `getCategories("income")` for income categories, and `getCategories("transfer")` for transfer categories. Transfer transactions are automatically excluded from all spending and income reports.
12. **Pattern extraction too specific**: If auto-tagging isn't working, check if the extracted pattern is too specific. Transaction descriptions from same merchant often have different suffixes (PAYROLL vs DIR DEP vs ACH). The pattern should extract just the merchant identifier, not the full description.
13. **Always use `confirmTransaction()` for category changes**: The transactions page dropdown and tagger both use `confirmTransaction()` which learns patterns and auto-tags. Don't use `updateTransaction()` directly for category changes or patterns won't be learned.
14. **Plaid orphan items = wasted money**: If you reset the database without calling `itemRemove()` on Plaid, those items remain active and you'll be billed! Always use `npm run db:safe-reset` instead of `npm run db:reset` when you have Plaid connections. To find orphans, check dashboard.plaid.com or call `GET /api/plaid/status`.

## Additional Documentation

Detailed documentation for specific subsystems:

| File | Description |
|------|-------------|
| [DEMO.md](DEMO.md) | Demo mode guide - running the app with realistic sample data |
| [docs/deduplication.md](docs/deduplication.md) | AI-powered transaction deduplication system (3-tier matching, embeddings, LLM verification) |

