---
kind: configuration_system
name: Configuration System — Expo App Config, Environment Variables, and Runtime Constants
category: configuration_system
scope:
    - '**'
source_files:
    - app.json
    - .env.example
    - src/lib/supabase.ts
    - src/constants/theme.ts
    - src/constants/riskLevels.ts
    - src/lib/i18n.ts
    - src/lib/secureStorage.ts
---

## Overview

DermSight uses a layered configuration approach typical of Expo/React Native apps: build-time app metadata in `app.json`, environment variables for secrets via `EXPO_PUBLIC_*` prefixed `.env` files, TypeScript modules for compile-time constants (theme, risk tiers, labels), and secure storage for user/session runtime state. There is no centralized config loader; each subsystem reads its own configuration source.

## Build-Time App Configuration (`app.json`)

- `app.json` is the single source of truth for Expo project metadata: name, slug, version, scheme, orientation, splash screen, platform-specific settings (iOS bundle identifier, Android package + permissions, web output), plugins (expo-splash-screen, expo-location, expo-camera with permission strings), and experiments (typedRoutes, reactCompiler).
- This file is consumed by the Expo toolchain at build/publish time and is not read at runtime by application code.

## Environment Variables (`.env` / `EXPO_PUBLIC_*`)

- Secrets are declared in `.env.example` and loaded via Expo's `process.env.EXPO_PUBLIC_*` mechanism. The only documented secrets are `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- These values are read at module load time in `src/lib/supabase.ts`, which constructs the Supabase client with fallback defaults (`https://your-project.supabase.co`, `your-anon-key`) when the env vars are absent — so the app can start without valid credentials but sync will fail silently until configured.
- No other `process.env.*` usage was found in the codebase beyond these two Supabase keys.

## Compile-Time Constants (`src/constants/`)

- `src/constants/theme.ts` defines design tokens as TypeScript `as const` objects: `Colors.light`, `Colors.dark`, `Fonts` (via `Platform.select` for iOS/Android/web), `Spacing`, `BottomTabInset`, and `MaxContentWidth`. These are imported directly by components and Tailwind config — they are not loaded from files or env at runtime.
- `src/constants/riskLevels.ts` holds clinical business configuration: `RISK_TIER_CONFIG`, `CLASS_TO_RISK_TIER`, `DIAGNOSIS_LABELS`, and `ABCD_LABELS`. The comment explicitly states this is kept separate from ML inference so "clinical advisors can adjust without touching ML code," making it the de facto clinical policy configuration surface.

## Runtime User/Session State (Secure Storage)

- Sensitive runtime state (auth token, refresh token, PIN hash, user ID, worker name) is persisted via `src/lib/secureStorage.ts`, which wraps `expo-secure-store` with typed key constants (`KEYS.AUTH_TOKEN`, etc.).
- This is distinct from configuration: it stores per-user session data, not app-wide settings. A `clearAllSecureData()` helper wipes all keys together.
- Non-sensitive preferences (e.g., language selection) are not shown to be persisted here; i18n defaults to `en` in `src/lib/i18n.ts` with no runtime persistence layer visible.

## Localization Resources

- i18next is initialized in `src/lib/i18n.ts` with bundled JSON resources from `assets/locales/{en,fr,sw}.json`. Languages are statically registered at import time — there is no dynamic loading or remote fetching of locale bundles.
- Default/fallback language is hardcoded to `en`.

## Platform-Specific & Plugin Configuration

- Platform differences are handled inline via React Native `Platform.select` (fonts, tab insets) rather than a config file.
- Plugin behavior (camera/location permissions, splash screen assets) is declared declaratively in `app.json` under `plugins[]`, not via runtime flags.

## Conventions Observed

| Concern | Where configured | How loaded |
|---|---|---|
| App identity & build metadata | `app.json` | Expo toolchain |
| Backend URLs & keys | `.env` → `process.env.EXPO_PUBLIC_*` | Module-level `import` in `src/lib/supabase.ts` |
| Design tokens & layout constants | `src/constants/theme.ts` | Direct TS imports |
| Clinical triage rules | `src/constants/riskLevels.ts` | Direct TS imports |
| Supported languages | `src/lib/i18n.ts` + `assets/locales/*.json` | i18next init on startup |
| Auth/session secrets | `src/lib/secureStorage.ts` (expo-secure-store) | Per-feature calls |

## Constraints & Rules

- Secrets must use the `EXPO_PUBLIC_` prefix to be exposed to the Expo bundler (enforced by the convention used in `.env.example` and `supabase.ts`).
- Sensitive runtime data (tokens, PIN hash) must go through `expo-secure-store` via `secureStorage.ts`; the module comment states "Never stores sensitive data in SQLite" — this is an enforced architectural rule implemented by the wrapper API.
- Clinical mapping logic is isolated in `riskLevels.ts` so that changes to triage policy do not require modifying ML inference code (stated intent in the file's doc comment).
- Fallback defaults are provided for Supabase URL/key so the app boots even without `.env` configured; however, sync functionality depends on those values being set correctly.