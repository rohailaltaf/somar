# Somar

A modern, privacy-focused personal finance app for tracking spending and income. Import bank statements, auto-categorize transactions, and track spending against budgets — all running locally on your machine.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![SQLite](https://img.shields.io/badge/SQLite-Local-blue?logo=sqlite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/dashboard.png" alt="Dashboard" />
      <p align="center"><strong>📊 Dashboard</strong><br/>At-a-glance overview of spending, budgets, and unconfirmed transactions</p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/tagger.png" alt="Transaction Tagger" />
      <p align="center"><strong>⚡ Tinder-Style Tagger</strong><br/>Quickly categorize transactions with swipes, keyboard shortcuts, or clicks</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/transactions.png" alt="Transactions" />
      <p align="center"><strong>📋 Transactions</strong><br/>Search, filter, and manage all your transactions with powerful filters</p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/reports.png" alt="Reports" />
      <p align="center"><strong>📈 Spending Reports</strong><br/>Track monthly spending with category breakdowns and budget progress</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/categories.png" alt="Categories" />
      <p align="center"><strong>🏷️ Category Management</strong><br/>Organize spending, income, and transfer categories with monthly budgets</p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/accounts.png" alt="Accounts" />
      <p align="center"><strong>🏦 Bank Connections</strong><br/>Connect via Plaid for automatic syncing or add manual accounts for CSV imports</p>
    </td>
  </tr>
</table>

## Features

### Tinder-Style Transaction Tagger
Quickly categorize transactions with swipe gestures or keyboard shortcuts. The app learns from your choices and auto-categorizes future transactions.

- **Swipe right** or press `Y` → Confirm category
- **Swipe left** or press `N` → Skip
- **Press `E`** → Exclude transaction
- **Press `Z`** → Undo last action
- Click any category pill to instantly assign

### Smart CSV Import
Import bank and credit card statements with intelligent column detection.

- Auto-detects date, description, and amount columns
- Handles different sign conventions (some banks show expenses as positive)
- Duplicate detection prevents importing the same transactions twice
- Works with exports from any bank

### Bank Connections via Plaid
Connect directly to 12,000+ financial institutions for automatic transaction syncing.

- Chase, Amex, Fidelity, Robinhood, and more
- Automatic background sync
- Secure OAuth authentication

### Budget Tracking
Set monthly budgets per category and track your progress with visual progress bars.

- Historical budget tracking (budgets apply from start month onwards)
- Dashboard shows spending vs budget at a glance
- Color-coded progress indicators

### Reports & Analytics
Understand your spending patterns with visual reports.

- Monthly spending overview
- Burn-up charts comparing this month to last
- Category breakdowns

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/somar.git
cd somar

# Install dependencies
npm install

# Set up the database
npm run db:push
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Demo Mode (Quick Preview)

Want to see the app with realistic data right away? Use demo mode:

```bash
# Run demo mode (resets demo DB and starts dev server)
npm run demo
```

This creates a separate `finance-demo.db` with:
- 6 accounts (checking, credit cards, savings, investment)
- 3 mock Plaid connections (Chase, Amex, Fidelity)
- 680+ transactions over 12 months
- Realistic spending patterns and merchant names
- Pre-set budgets for all categories

Perfect for testing features without connecting your real data!

**See [DEMO.md](DEMO.md) for more details.**

### Plaid Setup (Optional)

To enable bank connections, create a [Plaid](https://plaid.com) account and add your credentials:

```bash
# Copy the example environment file
cp .env.example .env.development

# Edit .env.development and add:
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

## Usage

### Getting Started

1. **Add an account** — Go to Accounts and either connect a bank via Plaid or create a manual account for CSV imports
2. **Import transactions** — Upload a CSV export from your bank, or let Plaid sync automatically
3. **Categorize** — Use the Tagger to quickly categorize transactions. The app learns your preferences!
4. **Set budgets** — Go to Categories and set monthly budgets for spending categories
5. **Track progress** — The dashboard shows your spending vs budgets at a glance

### Keyboard Shortcuts (Tagger)

| Key | Action |
|-----|--------|
| `Y` or `→` | Confirm suggested category |
| `N` or `←` | Skip to next transaction |
| `E` | Exclude from spending calculations |
| `Z` | Undo last action |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) with App Router
- **Database:** SQLite via [Prisma](https://prisma.io) (runs locally, no server needed)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Charts:** [Recharts](https://recharts.org)
- **Bank Connections:** [Plaid](https://plaid.com)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── accounts/           # Account management + Plaid
│   ├── categories/         # Category & budget management
│   ├── transactions/       # Transaction list with filters
│   ├── tagger/             # Swipe-to-categorize UI
│   ├── upload/             # CSV import wizard
│   └── reports/            # Analytics & charts
├── actions/                # Server Actions
├── components/             # React components
└── lib/                    # Utilities & database
```

## Database Commands

```bash
# Development
npm run db:push       # Apply schema changes
npm run db:seed       # Seed default categories
npm run db:reset      # Reset database (WARNING: deletes all data)
npm run db:studio     # Open Prisma Studio GUI

# Demo (separate database with realistic data)
npm run demo          # Reset demo DB + start dev server
npm run db:reset:demo # Reset demo database only

# Production
npm run db:push:prod
npm run db:seed:prod
npm run db:reset:prod
npm run db:studio:prod
```

## Environment Configuration

The app supports separate development, demo, and production databases:

| Environment | Database File | Config File | Purpose |
|-------------|---------------|-------------|---------|
| Development | `finance-dev.db` | `.env.development` | Your personal development data |
| Demo | `finance-demo.db` | `.env.demo` | Realistic sample data for testing |
| Production | `finance-prod.db` | `.env.production` | Production data |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is released under the O'Saasy License. See the [LICENSE](LICENSE) file for details.

---

**Privacy Note:** All your financial data stays on your machine. The SQLite database is stored locally and never uploaded anywhere. Bank connections via Plaid use secure OAuth — your bank credentials are never stored in the app.
