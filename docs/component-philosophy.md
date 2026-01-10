# Component Philosophy

This document defines how we build and maintain components across web and mobile platforms. Follow these principles exactly.

---

## Core Principle

**Maximize shared code. Minimize platform-specific code.**

Every class, every style, every prop name should be identical across platforms unless there is a technical reason it cannot be.

---

## Directory Structure

Components must mirror each other across platforms:

```
packages/shared/src/styles/components/
  hero-card.styles.ts        ← Shared styles

apps/web/src/components/dashboard/
  hero-card.tsx              ← Web implementation

apps/mobile/src/components/dashboard/
  hero-card.tsx              ← Mobile implementation
```

**No extra nesting.** If web has `dashboard/hero-card.tsx`, mobile has `dashboard/hero-card.tsx`. Not `dashboard/bento/hero-card.tsx` on one and `dashboard/hero-card.tsx` on the other.

---

## Component Extraction Parity

**If one platform has a dedicated component file, the other MUST have one too.**

This is a critical rule. Never have UI functionality as a dedicated component on one platform but inline in a screen/page file on the other.

### The Rule

```
// WRONG - Asymmetric extraction
apps/mobile/src/components/ui/floating-tab-bar.tsx    ← Dedicated file
apps/web/src/components/nav.tsx (lines 159-232)       ← Inline in nav.tsx

// CORRECT - Both extracted
apps/mobile/src/components/ui/floating-tab-bar.tsx    ← Dedicated file
apps/web/src/components/ui/floating-tab-bar.tsx       ← Dedicated file
```

### What Requires Extraction

Extract to a dedicated component file when ANY of these apply:

1. **Reusable UI pattern** - Could be used in multiple places
2. **Complex rendering logic** - More than ~20 lines of JSX
3. **Has its own animation/interaction** - Indicators, transitions, gestures
4. **Visual effect** - Backgrounds, gradients, overlays
5. **The other platform already extracted it** - Match the extraction

### Common Violations to Watch For

| UI Element | Wrong | Right |
|------------|-------|-------|
| Floating tab bar | Inline in nav.tsx | Dedicated `floating-tab-bar.tsx` |
| Atmospheric background | Inline in page.tsx | Dedicated `atmospheric-background.tsx` |
| Section headers | Inline in page.tsx | Use `DashboardSectionHeader` component |
| Empty states | Inline `<View>` JSX | Use `EmptyState` component |

### When Inline is Acceptable

- **Layout wrappers** - Simple `<div className="grid">` containers
- **One-off structure** - Page-specific layout that won't repeat
- **Platform-specific chrome** - Desktop nav that mobile doesn't need (and vice versa)

---

## Props Interface

Props must be **identical** across platforms. Define the interface in the shared styles file or a shared types file.

```typescript
// packages/shared/src/styles/components/hero-card.styles.ts

export interface HeroCardProps {
  currentMonth: string;
  totalSpending: number;      // NOT "spendingValue" on one platform
  spendingChange: number | null;  // NOT "percentChange" on one platform
  budgetProgress: number;
  budgetRemaining: number;
  hasBudget: boolean;
}
```

Both platforms import and use this exact interface.

---

## Shared Styles Structure

Every component has a corresponding `.styles.ts` file in `@somar/shared/styles`:

```typescript
// hero-card.styles.ts

export const heroCardStyles = {
  // 1. Numeric values (for inline styles on mobile, or template literals on web)
  heights: {
    mobile: 280,
    desktop: 380,
  },

  // 2. Class strings (used directly via className on both platforms)
  header: {
    container: "flex flex-row justify-between items-start",
    monthLabel: "text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground",
    subtitle: "text-xs text-foreground-secondary mt-1",
  },

  // 3. Color values (oklch for web CSS, hex for mobile native)
  colors: {
    oklch: {
      gradientStart: "oklch(0.35 0.15 260)",
    },
    hex: {
      gradientStart: "#5b6ee1",  // Pre-computed or use oklchToHex()
    },
  },
} as const;
```

---

## Using Shared Styles

### Class Strings

**Always use the shared class string. Never write the same classes inline.**

```typescript
// CORRECT - Both platforms
<View className={heroCardStyles.header.container}>

// WRONG - Duplicating classes
<View className="flex-row justify-between items-start">  // Web
<View style={{ flexDirection: "row", ... }}>            // Mobile
```

### Numeric Values

For values that must be numbers (React Native `style` prop):

```typescript
// Web - can use class or style
<div style={{ minHeight: heroCardStyles.heights.mobile }}>

// Mobile - must use style for numbers
<View style={{ minHeight: heroCardStyles.heights.mobile }}>
```

### Colors

```typescript
// Web - use oklch directly in CSS/style
background: heroCardStyles.colors.oklch.gradientStart

// Mobile - use hex (RN doesn't support oklch)
backgroundColor: heroCardStyles.colors.hex.gradientStart
// OR
backgroundColor: oklchToHex(heroCardStyles.colors.oklch.gradientStart)
```

---

## What Goes in Shared Styles

1. **All class strings** - Every Tailwind/NativeWind class used by the component
2. **All numeric values** - Heights, widths, padding, border radius, animation durations
3. **All colors** - Both oklch (web) and hex (mobile) versions
4. **Helper functions** - `getBentoValueClass(highlight, value)`, etc.

---

## What Stays Platform-Specific

1. **Animation libraries** - `framer-motion` (web) vs `react-native-reanimated` (mobile)
2. **Gradient components** - CSS gradients (web) vs `LinearGradient` (mobile)
3. **Grid layout classes** - `col-span-12 lg:col-span-7` (web grid system only)

---

## Animation Parity: framer-motion ↔ reanimated

Animations use different libraries but should have matching behavior. Use this mapping:

### Entering Animations

| Effect | framer-motion (web) | reanimated (mobile) |
|--------|---------------------|---------------------|
| Fade + slide up | `initial={{ opacity: 0, y: 30 }}` | `FadeInDown.duration(700)` |
| Fade + slide down | `initial={{ opacity: 0, y: -30 }}` | `FadeInUp.duration(700)` |
| Fade + slide from left | `initial={{ opacity: 0, x: -20 }}` | `FadeInLeft.duration(500)` |
| Fade + slide from right | `initial={{ opacity: 0, x: 20 }}` | `FadeInRight.duration(500)` |
| Fade + scale | `initial={{ opacity: 0, scale: 0.8 }}` | `FadeIn.duration(400)` or `ZoomIn` |
| Fade only | `initial={{ opacity: 0 }}` | `FadeIn.duration(400)` |

### Timing

| framer-motion | reanimated |
|---------------|------------|
| `transition={{ duration: 0.7 }}` | `.duration(700)` (ms) |
| `transition={{ delay: 0.2 }}` | `.delay(200)` (ms) |
| `ease: [0.16, 1, 0.3, 1]` | `Easing.bezier(0.16, 1, 0.3, 1)` |

### Example: Matching Staggered Animation

```typescript
// Web (framer-motion)
<motion.p
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}
>

// Mobile (reanimated)
<Animated.Text
  entering={FadeInLeft.duration(500).delay(200)}
>
```

### Common Imports

```typescript
// Web
import { motion } from "framer-motion";

// Mobile
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";
```

**Rule:** When adding animations to one platform, add equivalent animations to the other with matching delays and durations.

---

## Critical: `flex` vs `flex-row`

**This is a common source of bugs when sharing styles between web and mobile.**

### The Problem

- **Web (Tailwind)**: `flex` enables `display: flex`. `flex-row` only sets `flex-direction: row`.
- **Mobile (NativeWind)**: Views are already flex containers. `flex-row` sets direction.

If you write `"flex-row justify-between"`, it works on mobile but **breaks on web** because flexbox isn't enabled.

### The Rule

**ALWAYS use `flex flex-row` together in shared class strings:**

```typescript
// CORRECT - Works on both platforms
header: "flex flex-row justify-between items-start"

// WRONG - Breaks on web (no display: flex)
header: "flex-row justify-between items-start"
```

### Quick Reference

| Intent | Shared Class String |
|--------|---------------------|
| Horizontal layout | `"flex flex-row ..."` |
| Vertical layout | `"flex flex-col ..."` |
| Just enable flex | `"flex ..."` |

**Never use `flex-row`, `flex-col`, or `gap-*` without `flex` prefix in shared styles.**

---

## No Inline Style Duplication

If you find yourself writing the same inline style on both platforms, it should be a shared class string instead.

```typescript
// BAD
// Web:
<div className="flex items-start justify-between">
// Mobile:
<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>

// GOOD
// Shared styles:
header: {
  container: "flex flex-row justify-between items-start",
}

// Both platforms:
<View className={heroCardStyles.header.container}>
```

---

## No Hardcoded Values

Every magic number or color must come from shared styles.

```typescript
// BAD
<View style={{ marginBottom: 12 }}>
background: "linear-gradient(135deg, oklch(0.35 0.15 260) 0%, ...)"

// GOOD
<View style={{ marginBottom: heroCardStyles.spacing.labelGap }}>
background: `linear-gradient(135deg, ${heroCardStyles.colors.oklch.gradientStart} 0%, ...)`
```

---

## Child Component Alignment

If a component uses child components, those must also be aligned:

1. Same component name
2. Same props interface
3. Same location in component tree

```typescript
// If web uses:
<BudgetBar percentage={budgetProgress * 100} />

// Mobile must use:
<BudgetBar percentage={budgetProgress * 100} />

// NOT:
<AnimatedProgressBar progress={budgetProgress} />  // Different name, different prop
```

---

## Conditional Rendering

Conditions for showing/hiding elements must be identical:

```typescript
// BAD
// Web:
{hasBudget && <BudgetSection />}
// Mobile:
{totalBudget > 0 && <BudgetSection />}

// GOOD - Both platforms:
{hasBudget && <BudgetSection />}
```

---

## Display & Formatting Parity

**Data must be displayed identically on both platforms.**

Formatting inconsistencies confuse users who switch between web and mobile. The same transaction should never show `$1,234.56` on web and `$1,235` on mobile.

### What Must Match

1. **Decimal places** - If web shows cents, mobile shows cents
2. **Sign display** - Same format: `"-$50"` or `"- $50"` or `"($50)"`
3. **Percentage precision** - `"45%"` vs `"45.2%"` must match
4. **Date formats** - `"Jan 5"` vs `"January 5"` must match
5. **Currency symbols** - `"$1,234"` vs `"USD 1,234"` must match
6. **Null/empty display** - `"N/A"` vs `"-"` vs hiding element must match
7. **Text truncation** - Same max length before ellipsis

### How to Ensure Parity

**Use shared formatting functions from `@somar/shared`:**

```typescript
// CORRECT - Both platforms use same function with same params
import { formatCurrency } from "@somar/shared";
formatCurrency(amount, true)  // showCents = true

// WRONG - Different calls produce different output
// Web:
formatCurrency(amount, true)   // "$1,234.56"
// Mobile:
formatCurrency(amount)         // "$1,235" (showCents defaults false)
```

**Use shared hooks that encapsulate formatting:**

```typescript
// CORRECT - Hook returns pre-formatted display string
const { display } = useAmountDisplay(amount, { showCents: true });
return <Text>{display}</Text>;

// WRONG - Manual formatting that may differ
return <Text>{isExpense ? "-" : "+"}{formatCurrency(amount)}</Text>;
```

### Common Violations

| Issue | Wrong | Right |
|-------|-------|-------|
| Cents display | Mobile omits `showCents` param | Pass explicit `showCents: true` |
| Sign prefix | Manual `{isExpense ? "-" : "+"}` | Use `display` from `useAmountDisplay` |
| Percentage | `toFixed(1)` vs `toFixed(0)` | Use shared `formatPercentage()` |

---

## When to Stop and Ask

**If you encounter different logic between platforms, STOP and ask me.**

Do NOT assume:
- That a difference is intentional
- That you should "preserve" the difference
- That one platform's approach is correct

Examples of logic differences that require clarification:
- Progress bar showing different values (budget % vs total %)
- Different conditional rendering logic
- Different calculations for the same concept
- Different data transformations

When you find a difference, ask: "Web does X, mobile does Y. Which is correct?"

---

## Component Contracts (Props Interfaces)

**Never define props interfaces locally if a shared contract exists.**

Contracts live in `@somar/shared/components` and define the props API for components that exist on both platforms.

### The Rules

1. **Before defining a local interface, check shared first**
   ```typescript
   // WRONG - Defining local interface
   interface DateSectionHeaderProps {
     date: string;
     dayTotal?: number;
   }

   // RIGHT - Import from shared
   import type { DateSectionHeaderProps } from "@somar/shared/components";
   ```

2. **Contracts are only for cross-platform components**
   - If a component exists on BOTH web AND mobile → contract belongs in shared
   - If a component is platform-specific (only web or only mobile) → interface stays local

3. **When contracts and components don't match**
   - If the shared contract has more props than you need, use it anyway (extra props are optional)
   - If the shared contract is missing props you need, update the shared contract first
   - Never silently redefine a simpler local version

### Available Contracts

Import from `@somar/shared/components`:
- `BudgetRowProps` - Category spending vs budget display
- `TransactionRowProps` - Transaction list item
- `EmptyStateProps` - No data placeholder
- `SearchEmptyStateProps` - Search results empty state
- `AmountDisplayProps` - Currency amount with colors
- `DateSectionHeaderProps` - Date-grouped section header
- `DashboardSectionHeaderProps` - Dashboard section with action button
- `StatCardProps` - Dashboard stat card
- `QuickActionProps` - Quick action button
- `AnimatedCurrencyProps` - Animated currency display

### Contract Violations to Watch For

| Violation | Symptom | Fix |
|-----------|---------|-----|
| Local interface shadows shared | `interface FooProps { ... }` when `FooProps` exists in shared | Import from `@somar/shared/components` |
| Different prop names | Web uses `action`, shared uses `actions` | Use the shared name, update usages |
| Subset of props | Local has fewer optional props | Use full shared interface |
| Component without contract | Cross-platform component with no shared interface | Add contract to shared |

---

## Process for Adding/Modifying Components

1. **Read both implementations** - Web and mobile, fully
2. **Read the shared styles file** - If it exists
3. **Document all differences** - Props, classes, structure, child components
4. **Create/update shared styles first** - Before touching component files
5. **Update web component** - Use shared styles everywhere possible
6. **Update mobile component** - Mirror web exactly, use shared styles
7. **Verify prop interfaces match** - Identical names, identical types
8. **Verify child components match** - Same components, same props
9. **Remove unused code** - No `colors` props if using shared theme, etc.

---

## Checklist Before Considering a Component "Done"

- [ ] **Extraction parity** - If one platform has a dedicated file, the other does too
- [ ] **File location matches** - Same folder path on both platforms (e.g., both in `ui/` or both in `dashboard/`)
- [ ] **Props from shared contract** - If a contract exists in `@somar/shared/components`, import it (never redefine locally)
- [ ] All class strings come from shared styles
- [ ] All numeric values come from shared styles
- [ ] All colors come from shared styles (oklch for web, hex for mobile)
- [ ] No hardcoded values in either implementation
- [ ] Child components have same names and props
- [ ] Conditional rendering logic is identical
- [ ] Directory structure mirrors between platforms
- [ ] No platform takes a `colors` or `theme` prop if using shared theme
- [ ] **Visual features present on both** - If web has a gradient accent line, mobile has it too
- [ ] **Formatting matches** - Same decimal places, sign display, date format on both platforms
- [ ] **Uses shared formatting** - Calls `formatCurrency()`, `useAmountDisplay()` with identical params

---

## Example: Properly Aligned Component

```typescript
// packages/shared/src/styles/components/example.styles.ts
export interface ExampleProps {
  title: string;
  value: number;
  isHighlight: boolean;
}

export const exampleStyles = {
  container: "rounded-2xl p-4",
  header: "flex flex-row justify-between items-center mb-3",
  title: "text-lg font-semibold text-foreground",
  value: "text-2xl font-bold",
  valueHighlight: "text-primary",
  valueNormal: "text-foreground",
  heights: {
    min: 120,
  },
} as const;

export function getValueClass(isHighlight: boolean): string {
  return `${exampleStyles.value} ${isHighlight ? exampleStyles.valueHighlight : exampleStyles.valueNormal}`;
}
```

```typescript
// apps/web/src/components/example.tsx
import { exampleStyles, getValueClass, type ExampleProps } from "@somar/shared/styles";

export function Example({ title, value, isHighlight }: ExampleProps) {
  return (
    <div className={exampleStyles.container} style={{ minHeight: exampleStyles.heights.min }}>
      <div className={exampleStyles.header}>
        <span className={exampleStyles.title}>{title}</span>
      </div>
      <span className={getValueClass(isHighlight)}>{value}</span>
    </div>
  );
}
```

```typescript
// apps/mobile/src/components/example.tsx
import { exampleStyles, getValueClass, type ExampleProps } from "@somar/shared/styles";

export function Example({ title, value, isHighlight }: ExampleProps) {
  return (
    <View className={exampleStyles.container} style={{ minHeight: exampleStyles.heights.min }}>
      <View className={exampleStyles.header}>
        <Text className={exampleStyles.title}>{title}</Text>
      </View>
      <Text className={getValueClass(isHighlight)}>{value}</Text>
    </View>
  );
}
```

Notice: The only differences are `div`→`View`, `span`→`Text`, and the import for React Native. Everything else is identical.
