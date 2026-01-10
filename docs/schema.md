# Database Schema

The app uses a two-database model for E2EE.

## Central Database (PostgreSQL)

Server-side, stores only what the server needs. Schema at `apps/web/prisma/central-schema.prisma`.

| Table | Purpose |
|-------|---------|
| users | Email, name, encryption salt (Better Auth) |
| sessions | Active sessions with device tracking |
| accounts | OAuth accounts (Google, etc.) |
| plaid_items | Plaid connections with access tokens |
| plaid_account_meta | Minimal Plaid account info for syncing |
| encrypted_databases | Blob metadata (version, size) |
| pending_plaid_syncs | Queue for encrypted Plaid data |

## User Database (SQLite)

Client-side, encrypted. Each user has their own. Schema in `packages/shared/src/schema/index.ts`.

### accounts
| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| name | text | |
| type | text | checking, credit_card, investment, loan |
| plaid_account_id | text | Nullable, links to Plaid |
| created_at | text | ISO timestamp |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| name | text | |
| type | text | spending, income, transfer |
| color | text | oklch color string |
| created_at | text | ISO timestamp |

Default categories defined in `packages/shared/src/schema/index.ts`.

### category_budgets
| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| category_id | text | FK to categories |
| amount | real | Budget amount |
| start_month | text | YYYY-MM, applies from this month forward |
| created_at | text | ISO timestamp |

Only spending categories have budgets.

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| account_id | text | FK to accounts |
| category_id | text | FK to categories, nullable |
| description | text | |
| amount | real | **Negative = expense, Positive = income** |
| date | text | YYYY-MM-DD |
| excluded | boolean | If true, not counted in spending |
| is_confirmed | boolean | False until user confirms in tagger |
| plaid_transaction_id | text | Unique, nullable |
| plaid_original_description | text | Nullable |
| plaid_name | text | Nullable |
| plaid_merchant_name | text | Nullable |
| plaid_authorized_date | text | Nullable |
| plaid_posted_date | text | Nullable |
| created_at | text | ISO timestamp |

### categorization_rules
| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| pattern | text | Merchant pattern to match |
| category_id | text | FK to categories |
| is_preset | boolean | Learned rules take priority over presets |
| created_at | text | ISO timestamp |

### plaid_sync_state
| Column | Type | Notes |
|--------|------|-------|
| item_id | text | Primary key |
| cursor | text | Plaid sync cursor |
| last_synced_at | text | ISO timestamp |

Stored client-side (not server) for data integrity.

## Required Indexes

**Critical for performance** - without these, queries take 500ms instead of 2ms:

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_confirmed ON transactions(is_confirmed);
```

Indexes defined in `packages/shared/src/schema/index.ts`.

## Modifying Schemas

### Central Database (PostgreSQL)
1. Edit `apps/web/prisma/central-schema.prisma`
2. Run `pnpm --filter web db:push`

### User Database (SQLite)
1. Edit `packages/shared/src/schema/index.ts`
2. Note: No migrations - users must create new database for schema changes
