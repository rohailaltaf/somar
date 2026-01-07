# Mobile App (@somar/mobile)

React Native with Expo, Expo Router, NativeWind (Tailwind for RN), react-native-reanimated.

## Project Structure

```
app/                        # Expo Router pages
├── _layout.tsx             # Root layout (providers + fonts)
├── index.tsx               # Entry (redirects based on auth)
├── (auth)/                 # Auth screens
└── (tabs)/                 # Tab navigation

src/
├── components/ui/          # Shared UI components
├── providers/              # Auth + database providers
└── lib/
    ├── storage/            # expo-sqlite adapter
    ├── auth-client.ts      # Better Auth client
    ├── api.ts              # API helpers
    ├── theme.ts            # Theme colors (from @somar/shared)
    └── color.ts            # Color utils (from @somar/shared)
```

## Theme Colors

Theme is defined in `@somar/shared/theme`. Mobile needs hex/RGB (not oklch).

### For Native Components
Some RN components don't accept `className`:
```typescript
import { themeColors } from "@/lib/theme";
import { useColorScheme } from "nativewind";

const { colorScheme } = useColorScheme();
<ActivityIndicator color={themeColors[colorScheme ?? "light"].primary} />
<RefreshControl tintColor={themeColors[colorScheme ?? "light"].primary} />
```

### For Category Colors (stored as oklch)
```typescript
import { oklchToHex } from "@somar/shared/utils";

<View style={{ backgroundColor: oklchToHex(category.color) }} />
```

### After Changing Theme Colors
```bash
pnpm --filter mobile generate:theme
```
This regenerates `global.css` from `@somar/shared/theme`.

## Database

Uses expo-sqlite with the same `DatabaseAdapter` interface as web:
```typescript
// src/lib/storage/expo-sqlite-adapter.ts
import * as SQLite from "expo-sqlite";

export class ExpoSqliteAdapter implements DatabaseAdapter {
  all<T>(sql: string, params?: SqlParam[]): T[] { ... }
  get<T>(sql: string, params?: SqlParam[]): T | undefined { ... }
  run(sql: string, params?: SqlParam[]): void { ... }
  exec(sql: string): void { ... }
}
```

## Commands

```bash
pnpm --filter mobile dev            # Start Expo dev server
pnpm --filter mobile ios            # iOS simulator
pnpm --filter mobile android        # Android emulator
pnpm --filter mobile generate:theme # Regenerate global.css
```

## Mobile-Specific Gotchas

1. **React 19.1.0**: Must match react-native-renderer version exactly.

2. **@expo/metro-runtime**: Must be explicit dependency due to pnpm symlinks.

3. **oklch not supported**: React Native doesn't support oklch colors. Use hex via `oklchToHex()` or `themeColors`.

4. **global.css is auto-generated**: Don't edit manually. Run `generate:theme` after changing shared theme.

5. **Haptics**: Use `expo-haptics` for tactile feedback on gestures.

6. **Lucide icons need color prop**:
```typescript
import { Home } from "lucide-react-native";
<Home color={themeColors[colorScheme ?? "light"].foreground} />
```
