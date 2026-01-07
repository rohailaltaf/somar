# Commands Reference

## Root Commands (Turborepo)

```bash
pnpm dev              # Start all apps (web + mobile)
pnpm dev:web          # Start web app only
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm test             # Run all tests
```

## Web App Commands

### Development
```bash
pnpm --filter web dev           # Start dev server
pnpm --filter web db:push       # Push central DB schema
pnpm --filter web db:studio     # Open Prisma Studio
pnpm --filter web db:safe-reset # Safe reset (disconnects Plaid first!)
pnpm --filter web db:generate   # Generate Prisma Client
pnpm --filter web lint          # Run ESLint
pnpm --filter web test          # Run tests
pnpm --filter web test:watch    # Tests in watch mode
```

### Production
```bash
pnpm --filter web build              # Build for production
pnpm --filter web start              # Start production server
pnpm --filter web db:push:prod       # Push schema to prod
pnpm --filter web db:studio:prod     # Prisma Studio (prod)
pnpm --filter web db:safe-reset:prod # Safe reset prod
```

### Plaid Management
```bash
pnpm --filter web plaid:status       # Check connections (dev)
pnpm --filter web plaid:status:prod  # Check connections (prod)
```

## Mobile App Commands

```bash
pnpm --filter mobile dev            # Start Expo dev server
pnpm --filter mobile ios            # Start iOS simulator
pnpm --filter mobile android        # Start Android emulator
pnpm --filter mobile generate:theme # Regenerate global.css from shared theme
```

## Database Reset

### Safe Reset (Recommended)
Disconnects Plaid items first, then resets:
```bash
pnpm --filter web db:safe-reset       # Development
pnpm --filter web db:safe-reset:prod  # Production
```

### Unsafe Reset (Not Recommended)
Does NOT disconnect Plaid - you'll be billed for orphaned items!
```bash
pnpm --filter web db:reset            # Development
pnpm --filter web db:reset:prod       # Production
```

## Environment-Specific Commands

Commands use environment files in `apps/web/`:
- `.env.development` - Used by default
- `.env.production` - Used with `:prod` suffix commands

```bash
# Development (uses .env.development)
pnpm dev
pnpm --filter web db:push

# Production (uses .env.production)
pnpm build
pnpm --filter web db:push:prod
```
