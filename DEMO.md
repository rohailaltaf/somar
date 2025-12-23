# Demo Mode

The demo mode allows you to quickly spin up the application with realistic sample data for testing, development, or demonstrations.

## Quick Start

1. **Create `.env.demo` file** in the project root:

```bash
cat > .env.demo << 'EOF'
DATABASE_URL="file:../finance-demo.db"
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
EOF
```

2. **Run demo mode**:

```bash
npm run demo
```

This will:
- Delete any existing demo database
- Create a fresh schema
- Seed with realistic demo data
- Start the Next.js dev server

## What Gets Created

### Accounts (6 total)
- **Chase Checking** (Plaid-connected) - Primary checking account
- **Personal Savings** (Manual) - Savings account
- **Amex Blue Cash** (Plaid-connected) - Primary credit card
- **Visa Signature** (Manual) - Secondary credit card
- **Fidelity 401k** (Plaid-connected) - Investment account
- **Emergency Fund** (Manual) - Emergency savings

### Plaid Connections (3 mock)
- Chase (checking account)
- American Express (credit card)
- Fidelity Investments (401k)

*Note: These are mock Plaid connections with fake tokens - they won't actually sync from Plaid APIs.*

### Transactions (1200+)
- **12 months** of transaction history
- **Income**: Bi-monthly paychecks ($4,250 each) + occasional freelance income
- **Recurring expenses**: 
  - Rent ($2,400/month)
  - Subscriptions (Netflix, Spotify, etc.)
  - Utilities (PG&E, Comcast, etc.)
- **Variable expenses**:
  - Groceries (8-12 transactions/month)
  - Restaurants (10-15 transactions/month)
  - Shopping (3-8 transactions/month)
  - Gas/Car (4-6 transactions/month)
  - Entertainment (2-4 transactions/month)
  - Occasional travel expenses
- **Mix of confirmed (70%) and unconfirmed (30%)** transactions for tagger demo
- **Realistic merchant names** that match preset categorization rules

### Budgets
Monthly budgets for all spending categories:
- Restaurant: $500
- Grocery: $600
- Shopping: $300
- House: $2,000
- Travel: $400
- Car: $200
- Entertainment: $200
- Subscriptions: $150
- Work: $100
- Personal: $200

## Demo Data Features

### Realistic Transaction Descriptions
Transactions mimic real bank/credit card descriptions:
- `"POS CHIPOTLE #1249 SAN FRANCISCO CA"`
- `"AMAZON.COM*AB12CD34 AMZN.COM/BILL"`
- `"SHELL OIL 12345678 OAKLAND CA"`
- `"TECH CORP INC PAYROLL PPD"`

### Auto-Categorization Ready
~70% of transactions are pre-categorized using the app's preset rules. The remaining 30% are left unconfirmed for testing the tagger feature.

### Date Distribution
- Transactions span the last 12 months
- Weighted toward more recent dates
- Regular income on the 7th and 22nd of each month
- Random distribution for other transactions

## NPM Scripts

```bash
npm run demo              # Reset demo DB + start dev server
npm run db:reset:demo     # Reset demo database only (no server)
npm run db:push:demo      # Push schema changes to demo DB
npm run db:seed:demo      # Seed demo DB with data
```

## Testing Features

After running `npm run demo`, you can test:

1. **Dashboard** - View spending overview with real data
2. **Transactions** - Browse 1200+ transactions with filters
3. **Tagger** - Categorize ~360 unconfirmed transactions
4. **Reports** - View spending trends over 12 months
5. **Accounts** - See mix of Plaid-connected and manual accounts
6. **Categories & Budgets** - See realistic budget tracking

## Resetting Demo Data

The demo database is automatically reset every time you run `npm run demo`. If you want to keep your demo data between runs, use:

```bash
dotenv -e .env.demo -- next dev
```

## Notes

- Demo data is completely separate from development and production databases
- Mock Plaid connections won't actually sync - they're just for UI demonstration
- Transaction amounts are weighted toward smaller, more realistic values
- All categories and preset categorization rules are included

