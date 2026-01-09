# AGENTS.md - AI Agent Guide

## Agent Guidelines

**DO NOT do more than what is asked.** Confirm with the user before implementing additional features. Stick to the specific request.

**Use to-do lists for non-trivial tasks.** If a task involves multiple steps, create and maintain a to-do list to track progress. Mark items as in-progress when starting and completed when done. This provides visibility and ensures nothing is missed.

**Check shared packages before implementing inline types.** Types like `AccountType`, `CategoryType` exist in `@somar/shared`:
```typescript
import type { AccountType, CategoryType } from "@somar/shared";
```

## Project Overview

Personal finance app with E2EE. Users import CSV exports or connect banks via Plaid, auto-categorize transactions, and track spending against budgets.

**Key Features:** Tinder-style transaction tagger, smart CSV import, learning categorization, Plaid integration, end-to-end encryption.

## Tech Stack

| Layer | Web | Mobile | Shared |
|-------|-----|--------|--------|
| Framework | Next.js 16 (App Router) | Expo + Expo Router | - |
| UI | shadcn/ui + Tailwind v4 | NativeWind | - |
| User DB | sql.js (browser) | expo-sqlite | SQLite schema |
| Central DB | PostgreSQL via Prisma | - | - |
| Animations | Framer Motion | react-native-reanimated | - |

## Monorepo Structure

```
somar/
├── apps/web/          # @somar/web - Next.js app
├── apps/mobile/       # @somar/mobile - Expo app
├── packages/shared/   # @somar/shared - Types, services, hooks, theme
└── docs/              # Detailed documentation
```

**Commands:** Use `pnpm --filter <package>` for package-specific commands.
```bash
pnpm dev              # Start all apps
pnpm dev:web          # Start web only
pnpm --filter web db:safe-reset  # Reset DB (disconnects Plaid first!)
```

See [docs/commands.md](docs/commands.md) for full reference.

## Critical Conventions

### Amount Signs
- **Negative = expense** (money out) - displayed in red
- **Positive = income** (money in) - displayed in green
- Enforced throughout: `amount < 0` filters for expenses

### Date Handling
Store as `YYYY-MM-DD` strings. Parse without timezone conversion:
```typescript
const [year, month, day] = dateStr.split("-").map(Number);
const date = new Date(year, month - 1, day);
```

### Two-Database Model
- **Central DB** (PostgreSQL): Auth, Plaid tokens - server-side
- **User DB** (SQLite): Transactions, categories - client-side, encrypted

### Category Types
- **spending**: Has budgets, tracked as expenses
- **income**: No budgets, tracked as income
- **transfer**: Auto-excluded from reports, no budgets

## Shared Package Imports

```typescript
// Types and core
import { type AccountType, type DatabaseAdapter } from "@somar/shared";

// Services (data layer)
import { getAllTransactions, confirmTransaction } from "@somar/shared/services";

// React hooks
import { useTransactions, useAccounts } from "@somar/shared/hooks";

// Theme (single source of truth)
import { hexColors, oklchColors } from "@somar/shared/theme";
```

## Critical Gotchas

1. **Plaid orphans = wasted money**: Always use `db:safe-reset` not `db:reset` - otherwise Plaid items remain active and you're billed!

2. **Missing indexes = disaster**: Transactions table MUST have indexes. Without them, queries take 500ms instead of 2ms.

3. **Always use `confirmTransaction()`**: Both tagger and transactions page use this - it learns patterns and auto-tags.

4. **Never fetch all transactions**: Use pagination. Even 1,000 rows causes 700ms+ render times.

5. **Timezone dates**: Never use `new Date(dateString).toISOString()` - causes day shifts.

6. **Theme colors in shared**: All colors defined in `@somar/shared/theme`. After changes, run:
   ```bash
   pnpm generate:theme  # Updates both web and mobile
   ```

## Documentation

| File | Description |
|------|-------------|
| [docs/architecture.md](docs/architecture.md) | E2EE model, security, database design |
| [docs/schema.md](docs/schema.md) | Database tables and indexes |
| [docs/commands.md](docs/commands.md) | Full command reference |
| [docs/design-system.md](docs/design-system.md) | Visual design system |
| [docs/deduplication.md](docs/deduplication.md) | Transaction dedup (2-tier) |
| [apps/web/AGENTS.md](apps/web/AGENTS.md) | Web-specific patterns |
| [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md) | Mobile-specific patterns |
| [packages/shared/AGENTS.md](packages/shared/AGENTS.md) | Shared package details |
