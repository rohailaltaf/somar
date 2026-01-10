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
│   └── api/                # API routes (CRUD + Plaid)
├── providers/              # React context (auth, api)
├── hooks/                  # Web-specific hooks
├── components/ui/          # shadcn components
└── lib/
    ├── db/                 # Prisma client
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
- `src/hooks/use-plaid-sync.ts` - Triggers server-side sync
- `src/app/api/plaid/sync/route.ts` - Server-side sync with retry

API routes:
- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-token`
- `POST /api/plaid/sync` - Syncs transactions to PostgreSQL
- `POST /api/dedup/verify` - LLM verification (max 100 pairs)

### Reports (`/reports`)
- Client components with React Query for data fetching
- Recharts for visualization

## API Routes

All user data is accessed through API routes using Prisma ORM:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/finance-accounts` | GET, POST | List/create accounts |
| `/api/finance-accounts/[id]` | PATCH, DELETE | Update/delete account |
| `/api/categories` | GET, POST | List/create categories |
| `/api/categories/[id]` | GET, PATCH, DELETE | Get/update/delete category |
| `/api/budgets` | POST | Create budget |
| `/api/budgets/[id]` | DELETE | Delete budget |
| `/api/transactions` | GET, POST | List/create transactions |
| `/api/transactions/[id]` | GET, PATCH, DELETE | Get/update/delete transaction |
| `/api/transactions/[id]/confirm` | POST | Confirm + learn pattern |
| `/api/transactions/stats` | GET | Spending analytics |
| `/api/user/seed-categories` | POST | Seed default categories |

## Patterns

### API Routes with Prisma
```typescript
// app/api/transactions/route.ts
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await db.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });
  return Response.json({ success: true, data: transactions });
}
```

### Server-Side Pagination
Never fetch all transactions on page load:
```typescript
// Client Component: paginated API call via React Query
const { data } = useQuery({
  queryKey: ["transactions", { page, accountId }],
  queryFn: () => apiGet(`/api/transactions?limit=50&offset=${page * 50}`),
});
```

## Environment Variables

```bash
# Database
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

1. **NEVER edit globals.css directly**: It's auto-generated from `scripts/generate-theme.ts`. Edit the generator script instead, then run `pnpm generate:theme`.

2. **Plaid test credentials**: `user_good` / `pass_good` in sandbox.

3. **Recharts empty data**: Test charts with empty datasets to avoid render errors.

4. **revalidatePath after mutations**: Call this to refresh server components.

5. **React 19.1.4**: Web uses patched version (different from mobile's 19.1.0).
