# Design System

A reference guide for creating cohesive, premium visual experiences across Somar's web and mobile dashboards.

> **Scope:** This document covers the dashboard screens only. Other screens may follow different patterns until this system is extended.

## Design Philosophy

**Observatory aesthetic.** The dashboard feels like a financial command center—dark, atmospheric, with data presented as glowing elements against a deep space backdrop. Premium but not flashy.

**Key principles:**
1. **Depth through layering** — Background nebulas, card surfaces, then content
2. **Motion with purpose** — Animations guide attention and provide feedback
3. **Typography hierarchy** — Serif for hero numbers, sans-serif for everything else
4. **Subtle glow effects** — Data points emit soft light, creating visual weight

## Color System

### OKLCH Color Space

All colors use **OKLCH** format: `oklch(L C H)` where:
- **L** = Lightness (0-1)
- **C** = Chroma/saturation (0-0.4)
- **H** = Hue (0-360 degrees)

OKLCH provides perceptually uniform colors—a 0.1 change in L looks the same regardless of hue.

### Core Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | `oklch(0.98 0.005 260)` | `oklch(0.08 0.015 260)` | Page background |
| `foreground` | `oklch(0.15 0.02 260)` | `oklch(0.95 0.01 260)` | Primary text |
| `card` | `oklch(1 0 0)` | `oklch(0.12 0.02 260)` | Card surfaces |
| `muted` | `oklch(0.95 0.01 260)` | `oklch(0.25 0.02 260)` | Subtle backgrounds |
| `muted-foreground` | `oklch(0.5 0.02 260)` | `oklch(0.55 0.02 260)` | Secondary text |
| `border` | `oklch(0.9 0.01 260)` | `oklch(0.2 0.02 260)` | Borders |
| `primary` | `oklch(0.45 0.18 260)` | `oklch(0.55 0.18 260)` | Primary actions, highlights |

### Semantic Colors

```
success:     oklch(0.6 0.18 145)   — Green, spending down
destructive: oklch(0.55 0.22 25)  — Red, over budget
warning:     oklch(0.75 0.18 75)  — Amber, near budget
```

### Premium Accents

The dashboard uses special accent colors for a premium feel:

```css
--premium-gold: oklch(0.78 0.12 75);      /* Gold highlights */
--premium-glow: oklch(0.45 0.18 260);     /* Primary glow */
```

### Budget Status Colors

Progress bars change color based on budget usage:

| Status | Color | Condition |
|--------|-------|-----------|
| Normal | `oklch(0.55 0.18 260)` | < 80% of budget |
| Warning | `oklch(0.75 0.18 75)` | 80-99% of budget |
| Over | `oklch(0.6 0.2 25)` | >= 100% of budget |

### Mobile Color Conversion

React Native doesn't support OKLCH. Use `oklchToHex()` from `apps/mobile/src/lib/color.ts`:

```tsx
import { oklchToHex } from "../src/lib/color";

const hexColor = oklchToHex(category.color);
// "oklch(0.65 0.2 30)" → "#e04d24"
```

For theme colors, use `themeColors` from `apps/mobile/src/lib/theme.ts`:

```tsx
import { themeColors } from "../src/lib/theme";
import { useColorScheme } from "nativewind";

const { colorScheme } = useColorScheme();
const colors = themeColors[colorScheme ?? "light"];
```

**Mobile Dark Mode RGB Values** (synchronized with web's OKLCH):

| Token | OKLCH | RGB | Hex |
|-------|-------|-----|-----|
| background | `oklch(0.08 0.015 260)` | `10 11 18` | `#0a0b12` |
| card | `oklch(0.11 0.02 260)` | `16 18 29` | `#10121d` |
| surface | `oklch(0.12 0.02 260)` | `18 20 32` | `#121420` |
| border | `oklch(0.28 0.02 260)` | `46 50 66` | `#2e3242` |
| muted-foreground | `oklch(0.65 0.02 260)` | `148 154 170` | `#949aaa` |

## Typography

### Font Stack

| Font | Weight | Usage |
|------|--------|-------|
| **Instrument Serif** | 400 | Hero numbers (spending totals) |
| **DM Sans** | 400 | Body text, descriptions |
| **DM Sans** | 500 | Labels, captions |
| **DM Sans** | 600 | Emphasis, row amounts |
| **DM Sans** | 700 | Card titles, metrics |

### Type Scale

**Hero numbers (spending total):**
```css
/* Web */
font-family: var(--font-serif);
font-size: 6rem;  /* 96px, scales down on mobile */
letter-spacing: -0.02em;
line-height: 1;

/* Mobile */
fontFamily: "InstrumentSerif_400Regular"
fontSize: 64
letterSpacing: -2
lineHeight: 68
```

**Cents (after decimal):**
```css
/* Web */
font-size: 2.5rem;  /* 40px */
color: oklch(0.45 0.02 260);  /* Muted */

/* Mobile */
fontSize: 32
color: colors.mutedForeground
```

**Section headers:**
```css
font-family: DM Sans;
font-weight: 600;
font-size: 1.25rem;  /* 20px web, 18px mobile */
```

**Body/descriptions:**
```css
font-family: DM Sans;
font-weight: 400;
font-size: 0.875rem;  /* 14px */
```

**Micro labels:**
```css
font-family: DM Sans;
font-weight: 500;
font-size: 0.6875rem;  /* 11px */
letter-spacing: 0.15em;
text-transform: uppercase;
```

## Animation

### Timing Function

All animations use a custom ease-out curve for smooth deceleration:

```css
/* CSS */
cubic-bezier(0.16, 1, 0.3, 1)

/* Framer Motion */
ease: [0.16, 1, 0.3, 1]

/* React Native Reanimated */
Easing.out(Easing.cubic)
```

### Standard Durations

| Animation | Duration | Delay Pattern |
|-----------|----------|---------------|
| Page entrance | 600-800ms | — |
| Card entrance | 600-700ms | +100ms stagger |
| Number count-up | 1200-1500ms | — |
| Progress bar fill | 600-800ms | 200-500ms delay |
| Row stagger | 300-500ms | +50-60ms per item |

### Entrance Animations

**Fade in up (primary entrance):**
```tsx
// Framer Motion (Web)
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}

// Reanimated (Mobile)
entering={FadeInDown.duration(600).delay(100)}
```

**Staggered list items:**
```tsx
// Web
transition={{ delay: 0.4 + index * 0.06 }}

// Mobile
entering={FadeInDown.duration(300).delay(400 + index * 50)}
```

### Animated Counter

The hero spending number counts up from 0:

```tsx
// Web - using Framer Motion useMotionValue
const count = useMotionValue(0);
animate(count, value, { duration: 1.5, ease: [0.16, 1, 0.3, 1] });

// Mobile - using Reanimated
animatedValue.value = withTiming(value, {
  duration: 1200,
  easing: Easing.out(Easing.cubic),
});
```

### Background Animations

Subtle breathing effects for atmospheric elements:

```css
@keyframes breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.animate-breathe { animation: breathe 4s ease-in-out infinite; }
```

## Atmospheric Background

The dashboard has a deep space feel with layered gradient orbs.

### Web Implementation

```tsx
<div className="fixed inset-0 pointer-events-none overflow-hidden">
  {/* Primary nebula - purple, top-left */}
  <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh]
                  bg-[oklch(0.25_0.15_280_/_0.12)] rounded-full blur-[150px]
                  animate-breathe" />

  {/* Secondary glow - cyan, right */}
  <div className="absolute top-[30%] right-[-15%] w-[50vw] h-[60vh]
                  bg-[oklch(0.35_0.12_200_/_0.08)] rounded-full blur-[120px]
                  animate-breathe delay-300" />

  {/* Grid overlay */}
  <div className="absolute inset-0 opacity-[0.02]"
       style={{
         backgroundImage: `linear-gradient(oklch(0.5 0.02 260) 1px, transparent 1px),
                          linear-gradient(90deg, oklch(0.5 0.02 260) 1px, transparent 1px)`,
         backgroundSize: '60px 60px',
       }} />
</div>
```

### Mobile Implementation (SVG)

```tsx
<Svg width="100%" height="100%">
  <Defs>
    <RadialGradient id="nebulaPrimary" cx="15%" cy="5%" rx="80%" ry="60%">
      <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
      <Stop offset="40%" stopColor="#4f46e5" stopOpacity="0.08" />
      <Stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
    </RadialGradient>
    {/* Gold accent for premium feel */}
    <RadialGradient id="nebulaGold" cx="70%" cy="15%" rx="40%" ry="35%">
      <Stop offset="0%" stopColor="#d4b66c" stopOpacity="0.1" />
      <Stop offset="100%" stopColor="#d4b66c" stopOpacity="0" />
    </RadialGradient>
  </Defs>
  <Rect fill="url(#nebulaPrimary)" width="100%" height="100%" />
  <Rect fill="url(#nebulaGold)" width="100%" height="100%" />
</Svg>
```

**Note:** Only show atmospheric background in dark mode. Light mode uses a clean, minimal background.

## Component Patterns

### Bento Card

Cards in a grid layout with varying sizes. The main spending card spans multiple rows.

**Structure:**
```
┌─────────────────────────┬────────────┐
│                         │  To        │
│   $4,235.67             │ Categorize │
│   Total Spending        ├────────────┤
│                         │  Accounts  │
│   ████████░░ Budget     │            │
└─────────────────────────┴────────────┘
```

**Minimum Heights:**
| Card Type | Web | Mobile |
|-----------|-----|--------|
| Main spending card | 320px (lg: 380px) | N/A (hero section) |
| Side cards (uncategorized, accounts) | 160px | 160px |

**Highlight state (gradient border):**
```tsx
// Web
<div className="bg-gradient-to-br from-[oklch(0.35_0.15_260)] via-[oklch(0.25_0.1_280)]
                to-[oklch(0.2_0.08_300)] p-[1px] rounded-3xl">
  <div className="bg-[oklch(0.11_0.02_260)] rounded-3xl">
    {/* Content */}
  </div>
</div>

// Mobile
<LinearGradient
  colors={["#4f46e5", "#6366f1", "#4f46e5"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ borderRadius: 20, padding: 1.5, minHeight: 160 }}
>
  <View style={{ backgroundColor: "#0a0b12", borderRadius: 19 }}>
    {/* Content */}
  </View>
</LinearGradient>
```

### Trend Badge

Shows percentage change vs last month.

**Down (good):** Green background, down arrow
**Up (bad):** Red background, up arrow

```tsx
<div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
  isDown
    ? "bg-[oklch(0.55_0.15_145_/_0.15)] text-[oklch(0.7_0.12_145)]"
    : "bg-[oklch(0.5_0.18_25_/_0.15)] text-[oklch(0.75_0.15_25)]"
}`}>
  <ArrowDownRight className="w-3.5 h-3.5" />
  {Math.abs(change).toFixed(0)}%
  <span className="text-[0.65rem] opacity-70">vs last mo</span>
</div>
```

### Category Row

Shows category spending with animated progress bar.

```
┌──────────────────────────────────────────┐
│ ● Restaurant              $234 / $400    │
│ ████████████░░░░░░░░                     │
│                            58% of budget │
└──────────────────────────────────────────┘
```

**Color dot (12px on both platforms):**
```tsx
// Web
className="w-3 h-3 rounded-full"
style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}

// Mobile
style={{
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: color,
  shadowColor: color,
  shadowOpacity: 0.5,
  shadowRadius: 4,
}}
```

**Progress bar animation:**
```tsx
// Staggered entrance per row
initial={{ width: 0 }}
animate={{ width: `${percentage}%` }}
transition={{
  duration: 0.6,
  delay: 0.5 + index * 0.06,
  ease: [0.16, 1, 0.3, 1]
}}
```

### Transaction Row

Compact transaction display with category color bar.

```
┌──────────────────────────────────────────┐
│ █ Chipotle Mexican Grill       -$12.45   │
│   Jan 15 · Restaurant                    │
└──────────────────────────────────────────┘
```

**Category color bar:**
```tsx
<View style={{
  width: 3,       // Mobile: 3px
  height: 36,     // Fixed height
  borderRadius: 2,
  backgroundColor: categoryColor || colors.muted,
}} />
```

**Unconfirmed indicator:** Pulsing dot next to category name
```tsx
{!isConfirmed && (
  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.6_0.18_260)] animate-pulse" />
)}
```

### Quick Action Button

Small action buttons at the bottom of the dashboard.

```tsx
<motion.div
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="rounded-xl p-4 bg-[oklch(0.13_0.02_260)] border border-[oklch(0.2_0.02_260_/_0.5)]"
>
  <Icon className="w-4 h-4" />
  <p className="text-sm font-medium">Label</p>
  <p className="text-xs text-muted-foreground">Sublabel</p>
</motion.div>
```

**Highlight variant** (when action needed):
```tsx
className="bg-gradient-to-br from-[oklch(0.2_0.06_260)] to-[oklch(0.14_0.03_280)]
           border border-[oklch(0.35_0.12_260_/_0.3)]"
```

### Empty State

Centered message with icon when no data available.

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-14 h-14 rounded-2xl bg-[oklch(0.18_0.02_260)] flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-[oklch(0.4_0.02_260)]" />
  </div>
  <p className="text-[oklch(0.75_0.02_260)] font-medium">No transactions yet</p>
  <p className="text-sm text-[oklch(0.45_0.02_260)] mt-1 max-w-[200px]">
    Connect your bank or import transactions...
  </p>
  <Link className="mt-4 px-4 py-2 rounded-lg bg-primary text-white">
    Get Started
  </Link>
</div>
```

### Loading Skeleton

Placeholder while data loads. Match the layout of the actual content.

```tsx
<div className="h-[380px] rounded-3xl bg-[oklch(0.12_0.02_260)] animate-pulse" />
```

Use `animate-pulse` (web) or a subtle opacity animation (mobile).

## Spacing & Layout

### Spacing Scale

Spacing tokens match Tailwind's numeric scale exactly. Formula: `spacing[n] = n * 4px`

```typescript
import { spacing } from "@somar/shared/theme";

// Mobile usage - maps 1:1 to Tailwind classes
style={{ padding: spacing[4], gap: spacing[3] }}
// spacing[4] = 16px = same as p-4 in Tailwind
// spacing[3] = 12px = same as gap-3 in Tailwind
```

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `spacing[1]` | 4px | p-1, gap-1 | Tight spacing |
| `spacing[2]` | 8px | p-2, gap-2 | Compact spacing |
| `spacing[3]` | 12px | p-3, gap-3 | Default gaps |
| `spacing[4]` | 16px | p-4, gap-4 | **Standard horizontal padding** |
| `spacing[5]` | 20px | p-5, gap-5 | Comfortable padding |
| `spacing[6]` | 24px | p-6, gap-6 | Section margins |
| `spacing[8]` | 32px | p-8, gap-8 | Large spacing |
| `spacing[10]` | 40px | p-10, gap-10 | Hero padding |

### Grid System

**Web:** 12-column grid with responsive breakpoints
```tsx
className="grid grid-cols-12 gap-4 lg:gap-6"
```

**Main card:** `col-span-12 lg:col-span-7 row-span-2`
**Side cards:** `col-span-12 sm:col-span-6 lg:col-span-5`

**Mobile:** Flexbox with spacing tokens
```tsx
import { spacing } from "@somar/shared/theme";
style={{ flexDirection: "row", gap: spacing[3], paddingHorizontal: spacing[4] }}
```

### Card Padding

| Element | Web | Mobile |
|---------|-----|--------|
| Hero card | p-8 lg:p-10 | spacing[8] to spacing[10] |
| Standard card | p-6 lg:p-8 | spacing[6] to spacing[8] |
| List rows | px-4 py-3.5 | spacing[4] horizontal, spacing[3.5] vertical |

### Border Radius

Radius tokens match Tailwind's `rounded-*` utilities exactly.

```typescript
import { radius } from "@somar/shared/theme";

// Mobile usage - maps 1:1 to Tailwind classes
style={{ borderRadius: radius["2xl"] }}
// radius["2xl"] = 16px = same as rounded-2xl in Tailwind
```

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `radius.sm` | 2px | rounded-sm | Subtle rounding |
| `radius.DEFAULT` | 4px | rounded | Progress bars, tiny details |
| `radius.md` | 6px | rounded-md | Small elements |
| `radius.lg` | 8px | rounded-lg | Icon backgrounds |
| `radius.xl` | 12px | rounded-xl | Icon containers, inputs |
| `radius["2xl"]` | 16px | rounded-2xl | Standard cards, panels |
| `radius["3xl"]` | 24px | rounded-3xl | Hero cards, large modals |
| `radius.full` | 9999px | rounded-full | Pills, badges, dots |

**Key insight:** Spacing uses numeric keys (`spacing[4]`), radius uses t-shirt sizes (`radius["2xl"]`). This matches how Tailwind works: `p-4` vs `rounded-2xl`.

## Haptic Feedback (Mobile)

Use light impact feedback for interactive elements:

```tsx
import * as Haptics from "expo-haptics";

<Pressable onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Action
}}>
```

## Platform Differences

| Feature | Web | Mobile |
|---------|-----|--------|
| Animations | Framer Motion | react-native-reanimated |
| Gradients | CSS linear/radial-gradient | expo-linear-gradient, react-native-svg |
| Background effect | CSS blur + gradients | SVG RadialGradient |
| Colors | OKLCH native | Hex via `oklchToHex()` |
| Typography | CSS custom properties | Explicit fontFamily strings |
| Icons | Lucide React | Ionicons |

## File Reference

| File | Purpose |
|------|---------|
| `packages/shared/src/theme/spacing.ts` | Spacing & radius tokens (single source of truth) |
| `packages/shared/src/theme/colors.ts` | Color tokens |
| `apps/web/src/app/globals.css` | Web theme variables, animations |
| `apps/web/src/app/page.tsx` | Web dashboard implementation |
| `apps/mobile/src/lib/theme.ts` | Mobile theme colors (hex) |
| `apps/mobile/app/(tabs)/index.tsx` | Mobile dashboard implementation |
