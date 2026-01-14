# Somar

A modern personal finance app for tracking spending and income. Import bank statements, auto-categorize transactions, and track spending against budgets.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-blueviolet?logo=turborepo)

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

## Monorepo Structure

This project uses **Turborepo** with **pnpm workspaces** to manage multiple apps:

```
somar/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native/Expo mobile app
├── packages/
│   └── shared/           # Shared types, services, hooks, and theme
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspace config
```

### Apps

| App | Description | Status |
|-----|-------------|--------|
| `@somar/web` | Next.js web application | ✅ Active |
| `@somar/mobile` | React Native/Expo mobile app | 🚧 In Development |

### Packages

| Package | Description |
|---------|-------------|
| `@somar/shared` | Shared types, services, hooks, theme, and UI logic |

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
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/somar.git
cd somar

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.development
# Edit apps/web/.env.development with your database URL and secrets

# Set up the database (PostgreSQL)
pnpm --filter web db:push

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Plaid Setup (Optional)

To enable bank connections, create a [Plaid](https://plaid.com) account and add your credentials:

```bash
# Copy the example environment file (in apps/web/)
cp apps/web/.env.example apps/web/.env.development

# Edit apps/web/.env.development and add:
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

- **Monorepo:** [Turborepo](https://turbo.build) with pnpm workspaces
- **Web:** [Next.js 16](https://nextjs.org) with App Router
- **Mobile:** [React Native](https://reactnative.dev) with [Expo](https://expo.dev) and Expo Router
- **Database:** PostgreSQL via [Prisma](https://prisma.io)
- **UI (Web):** [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **UI (Mobile):** [NativeWind](https://www.nativewind.dev/) (Tailwind for React Native)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Charts:** [Recharts](https://recharts.org)
- **Bank Connections:** [Plaid](https://plaid.com)

## Project Structure

```
somar/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages
│   │   │   │   └── api/        # API routes (CRUD, Plaid, etc.)
│   │   │   ├── components/     # React components
│   │   │   ├── providers/      # Auth + API providers
│   │   │   ├── hooks/          # Web-specific hooks
│   │   │   └── lib/            # Utilities (Prisma, Plaid, etc.)
│   │   ├── prisma/             # Database schema (PostgreSQL)
│   │   └── public/             # Static assets
│   └── mobile/                 # React Native/Expo app
│       ├── app/                # Expo Router pages
│       │   ├── (auth)/         # Login, signout screens
│       │   └── (tabs)/         # Dashboard, transactions
│       ├── src/
│       │   ├── components/     # React Native components
│       │   ├── providers/      # Auth + API providers
│       │   └── lib/            # Theme, API helpers
│       └── metro.config.js     # Metro bundler config for pnpm
├── packages/
│   └── shared/                 # Shared code
│       └── src/
│           ├── services/       # API client wrappers
│           ├── hooks/          # Shared React hooks (React Query)
│           ├── api-client/     # HTTP client (configurable per platform)
│           ├── theme/          # Colors (oklch, hex, rgb)
│           └── ui-logic/       # Shared calculation logic
├── docs/                       # Documentation
└── turbo.json                  # Turborepo config
```

## Commands

### Root Commands (Turborepo)

```bash
pnpm dev          # Start all apps (web + mobile)
pnpm dev:web      # Start web app only
pnpm build        # Build all apps
pnpm lint         # Lint all packages
pnpm test         # Run tests
```

### Web App Commands (use --filter)

```bash
# Development
pnpm --filter web dev           # Start dev server
pnpm --filter web db:push       # Push DB schema changes
pnpm --filter web db:studio     # Open Prisma Studio
pnpm --filter web db:safe-reset # Reset DB (disconnects Plaid first)

# Production
pnpm --filter web build         # Build for production
pnpm --filter web db:push:prod  # Push schema to prod DB
pnpm --filter web db:studio:prod # Open Prisma Studio (prod)
```

### Mobile App Commands

```bash
pnpm --filter mobile dev       # Start Expo dev server
pnpm --filter mobile ios       # Start iOS simulator
pnpm --filter mobile android   # Start Android emulator
pnpm --filter mobile web       # Start web version
```

> **Note:** Web uses React ^19.1.4, mobile uses React 19.1.0 (to match react-native-renderer). Each app has its own node_modules, so they run together without conflicts.

## Environment Configuration

Environment files live in `apps/web/`:
- `.env.development` - Development configuration
- `.env.production` - Production configuration

Required variables:
```bash
# Database
CENTRAL_DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Plaid (optional)
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
PLAID_ENV="sandbox"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is released under the O'Saasy License. See the [LICENSE](LICENSE) file for details.
