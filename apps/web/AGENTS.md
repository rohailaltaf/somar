# Web App (@somar/web)

Next.js 16 with App Router, shadcn/ui, Tailwind CSS v4, Framer Motion.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Dashboard
│   ├── (auth)/             # Login, register, signout
│   ├── accounts/           # Account management + Plaid
│   ├── categories/         # Category + budget management
│   ├── transactions/       # Transaction list (paginated)
│   ├── tagger/             # Tinder-style categorization
│   ├── upload/             # CSV import wizard
│   ├── reports/            # Analytics with Recharts
│   └── api/                # API routes
├── providers/              # React context (auth, database)
├── hooks/                  # Web-specific hooks
├── components/ui/          # shadcn components
└── lib/
    ├── db/                 # Prisma client (central DB)
    ├── storage/            # sql.js adapter
    ├── dedup/              # LLM verifier (Tier 2)
    └── csv-parser.ts       # CSV parsing
```

## Key Features

### Tagger (`/tagger`)
- Shows unconfirmed transactions one at a time
- Click any category pill to confirm (no button needed)
- Keyboard: Y/→ confirm, N/← skip, E exclude, Z undo
- Confirms learn patterns and auto-tag remaining transactions

### CSV Import (`/upload`)
Steps: Select account → Upload → Map columns → Confirm signs → Review duplicates → Import

Sign convention step lets users flip signs if their bank uses opposite convention.

### Plaid Integration (`/accounts`)
Connection flow:
1. Click "Connect Bank" → Plaid Link opens
2. User authenticates with bank
3. Backend exchanges token, creates accounts
4. Auto-sync with retry logic (8 retries, exponential backoff)

Key files:
- `src/hooks/use-plaid-sync.ts` - Client-side sync (runs Tier 1 dedup)
- `src/app/api/plaid/sync/route.ts` - Server proxy with retry
- `src/components/auto-sync.tsx` - Auto-sync on page load

API routes:
- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-token`
- `POST /api/plaid/sync`
- `POST /api/dedup/verify` - LLM verification (max 100 pairs)

### Reports (`/reports`)
- Server + client component pattern
- Recharts for visualization
- `getDailyCumulativeSpending()` for burn-up charts

## Patterns

### API Routes
Business logic in `lib/`, API routes handle HTTP:
```typescript
// lib/plaid.ts - business logic
export async function syncTransactions() { ... }

// app/api/plaid/sync/route.ts - HTTP handler
export async function POST(request: Request) {
  const result = await syncTransactions();
  return Response.json(result);
}
```

### Server-Side Pagination
Never fetch all transactions on page load:
```typescript
// Server Component: metadata only
const [accounts, categories] = await Promise.all([...]);

// Client Component: paginated API call
const response = await fetch(`/api/transactions?page=1&limit=50`);
```

### Background Jobs (Next.js)
Don't await to run after response:
```typescript
// Immediate - await and return
const result = await processVisible(ids);

// Background - don't await
processRemaining().catch(() => {});

return result;
```

## Environment Variables

```bash
# Central DB
CENTRAL_DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Plaid
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
PLAID_ENV="sandbox"

# LLM dedup (optional)
OPENAI_API_KEY="..."
```

## Web-Specific Gotchas

1. **sql.js runs in browser**: User data never touches server. Encryption/decryption happens client-side.

2. **Plaid test credentials**: `user_good` / `pass_good` in sandbox.

3. **Recharts empty data**: Test charts with empty datasets to avoid render errors.

4. **revalidatePath after mutations**: Call this to refresh server components.

5. **React 19.1.4**: Web uses patched version (different from mobile's 19.1.0).
