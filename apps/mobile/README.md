# Somar Mobile

React Native/Expo mobile app for Somar personal finance tracker.

## Development

```bash
# From monorepo root
pnpm dev              # Start all apps (web + mobile)
pnpm --filter mobile dev   # Start mobile only

# Or from this directory
pnpm dev              # Start Expo dev server
pnpm ios              # Start iOS simulator
pnpm android          # Start Android emulator
```

## Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Navigation:** Expo Router
- **React:** 19.1.0 (pinned to match react-native-renderer)

## Project Structure

```
mobile/
├── app/              # Expo Router pages
│   ├── _layout.tsx   # Root layout
│   └── index.tsx     # Home screen
├── assets/           # Images, fonts, etc.
├── app.json          # Expo configuration
├── metro.config.js   # Metro bundler config (pnpm support)
└── package.json
```

## Notes

- Uses `@expo/metro-runtime` as explicit dependency for pnpm compatibility
- Custom `metro.config.js` enables pnpm symlink support
- Each app (web/mobile) has its own node_modules with isolated React versions
