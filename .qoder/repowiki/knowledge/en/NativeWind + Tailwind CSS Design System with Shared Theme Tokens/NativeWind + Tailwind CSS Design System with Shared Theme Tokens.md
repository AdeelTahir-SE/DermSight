---
kind: frontend_style
name: NativeWind + Tailwind CSS Design System with Shared Theme Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - tailwind.config.js
    - global.css
    - nativewind-env.d.ts
    - src/constants/theme.ts
    - src/components/ui/Button.tsx
    - src/components/ui/Card.tsx
    - src/components/ui/Badge.tsx
    - src/components/assessment/RiskTierBadge.tsx
---

## Styling Approach

DermSight uses **Tailwind CSS via NativeWind** as its primary styling system for a React Native/Expo app. The setup is configured through `tailwind.config.js` (with the `nativewind/preset`), a root `global.css` that imports Tailwind's base/components/utilities layers, and a TypeScript reference to `nativewind/types` in `nativewind-env.d.ts`. Components style themselves by passing className strings to standard React Native primitives (`View`, `Text`, `Pressable`) — there are no inline `style={}` objects used for layout or color decisions.

## Design Tokens

Tokens are centralized in two complementary sources:

- **Tailwind theme extensions** in `tailwind.config.js` define brand colors under custom namespaces: `primary` (teal scale 50–900), `navy` (light/dark variants), `risk` (urgent/high/medium/low mapped to red/orange/yellow/green), and `surface` (white/secondary/muted). Font family is extended to use a platform-native `System` sans-serif.
- **Runtime tokens** in `src/constants/theme.ts` expose typed JS constants consumed by components at runtime: a `Colors.light` / `Colors.dark` palette (text, background, border, error/success/warning, card surfaces), a `Fonts` object resolved per platform via `Platform.select` (iOS native font names, web CSS variables), a `Spacing` scale (2/4/8/16/24/32/64), plus `BottomTabInset` and `MaxContentWidth` platform-aware values.

Risk-related colors flow from `@/constants/riskLevels` (`RISK_TIER_CONFIG`) into UI components like `Badge` and `RiskTierBadge`, which read `config.bgColor` / `config.color` via inline styles while using Tailwind classes for shape and typography.

## Component Library Conventions

Reusable UI lives under `src/components/ui/` and follows a consistent pattern:

- Each component is a single-file functional component exporting a named function.
- Props include a `variant` enum (e.g. Button: `"primary" | "secondary" | "outline" | "danger"`) and a `size` enum (`"sm" | "md" | "lg"`) mapped to lookup tables of Tailwind class fragments.
- Base styles are composed via string concatenation of `baseStyle` + size + variant + conditional modifiers (e.g. disabled opacity).
- Components accept an optional `className` prop so consumers can extend them (see `Card`).
- Platform-specific runtime values (colors, fonts) come from `theme.ts`; visual structure comes from Tailwind classes.

Business-domain components under `src/components/assessment/`, `src/components/patient/`, and `src/components/sync/` compose these primitives and apply risk-level colors from `riskLevels.ts`.

## Responsive & Cross-Platform Strategy

- Layout responsiveness is achieved with Tailwind utility classes (flexbox, spacing, sizing) rather than media queries; no explicit responsive breakpoints are defined beyond Tailwind defaults.
- Platform differences are handled via `Platform.select` in `theme.ts` for fonts and insets, not via separate style files.
- Web-specific concerns (CSS variables for fonts) coexist with mobile-native font names within the same token file.

## Constraints Observed

- All styling goes through Tailwind classes on RN primitives via NativeWind; raw `StyleSheet.create` blocks are not used in the UI components reviewed.
- Brand colors must be referenced via the `primary`, `navy`, `risk`, `surface` namespaces defined in `tailwind.config.js` rather than ad-hoc hex literals (the only exceptions are status badges that hardcode semantic hexes for sync states).
- Risk tier visuals are sourced exclusively from `RISK_TIER_CONFIG` in `@/constants/riskLevels`, ensuring consistency across `Badge`, `StatusBadge`, and `RiskTierBadge`.