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

## Styling & Theming

The mobile app uses **NativeWind** (Tailwind for React Native) with a three-file theming system:

### File Relationship

```
global.css (source of truth)
     ↓
tailwind.config.js (maps CSS vars → className)
     ↓
src/lib/theme.ts (escape hatch for native components)
```

### 1. `global.css` — Design Tokens

Defines CSS custom properties with raw RGB values for light/dark modes:

```css
:root {
  --color-primary: 99 102 241;           /* Light: indigo-500 */
  --color-muted-foreground: 100 116 139; /* Light: slate-500 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: 129 140 248;        /* Dark: indigo-400 */
    --color-muted-foreground: 148 163 184;
  }
}
```

**Why RGB triplets?** Enables Tailwind alpha syntax like `bg-primary/50`.

### 2. `tailwind.config.js` — NativeWind Bridge

Maps CSS variables to Tailwind class names:

```js
colors: {
  primary: "rgb(var(--color-primary) / <alpha-value>)",
}
```

Usage in components:
```tsx
<Text className="text-primary">         {/* ✅ Works */}
<View className="bg-muted/80">          {/* ✅ 80% opacity */}
```

### 3. `src/lib/theme.ts` — Native Component Escape Hatch

Some React Native components **don't accept `className`** and need raw color strings:

```tsx
// ❌ These don't work with className
<ActivityIndicator color={???} />
<Ionicons color={???} />
<RefreshControl tintColor={???} />
```

Solution — import pre-computed hex values:

```tsx
import { themeColors } from "../src/lib/theme";
import { useColorScheme } from "nativewind";

const { colorScheme } = useColorScheme();
const colors = themeColors[colorScheme ?? "light"];

<ActivityIndicator color={colors.primaryForeground} />
<Ionicons color={colors.mutedForeground} />
<RefreshControl tintColor={colors.primary} />
```

### ⚠️ Keeping Colors in Sync

`theme.ts` values are **manually derived** from `global.css`. If you change a color in `global.css`, update `theme.ts` to match:

| CSS Variable | theme.ts key | Light | Dark |
|--------------|--------------|-------|------|
| `--color-primary` | `primary` | `#6366f1` | `#818cf8` |
| `--color-primary-foreground` | `primaryForeground` | `#ffffff` | `#0f172a` |
| `--color-muted-foreground` | `mutedForeground` | `#64748b` | `#94a3b8` |

## Notes

- Uses `@expo/metro-runtime` as explicit dependency for pnpm compatibility
- Custom `metro.config.js` enables pnpm symlink support
- Each app (web/mobile) has its own node_modules with isolated React versions
