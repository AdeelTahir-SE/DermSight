---
kind: dependency_management
name: Expo/React Native Dependency Management via npm + Lockfile
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - .gitignore
    - app.json
    - metro.config.js
    - babel.config.js
---

## System Overview

DermSight is an Expo-based React Native application that manages all third-party dependencies through **npm** (the default package manager for the project), with a single `package.json` at the repository root and a generated `package-lock.json` lockfile. There is no monorepo, no workspaces, no vendoring of JS packages, and no private npm registry configured.

## Key Files

- `package.json` — declares runtime dependencies (`dependencies`) and development-only dependencies (`devDependencies`). Runtime deps include the Expo SDK (~57.x), React Native (0.86.3), React (19.2.3), Supabase client, Drizzle ORM, Zustand, react-hook-form + Zod for validation, i18next for localization, NativeWind/Tailwind for styling, and platform-specific Expo plugins (camera, location, secure-store, background-fetch, task-manager, etc.). Dev dependencies are limited to TypeScript (~6.0.3) and `@types/react` (~19.2.2).
- `package-lock.json` — npm lockfile pinning exact resolved versions; committed alongside `package.json` to ensure reproducible installs across environments.
- `.gitignore` — explicitly ignores `node_modules/`, `.expo/`, `dist/`, `web-build/`, and native build folders (`/ios`, `/android`); dependency source code is never checked in.
- `app.json` — declares Expo plugin configuration (e.g. `expo-splash-screen`, `expo-location`, `expo-camera`) which must match corresponding entries in `package.json`.
- `metro.config.js` and `babel.config.js` — integrate NativeWind into the Metro bundler and Babel pipeline respectively; they consume dependencies declared in `package.json` but do not declare their own.

## Architecture & Conventions

- **Single-package flat structure**: All dependencies live in one top-level `package.json`; there are no per-feature or per-module `package.json` files.
- **Versioning strategy**: The project pins major versions tightly around Expo SDK 57 and React Native 0.86.3. Most Expo-managed packages use tilde ranges (`~57.x.y`) so patch updates auto-resolve, while some ecosystem libraries use caret ranges (`^x.y.z`) allowing minor bumps. This mix suggests manual version selection rather than an automated upgrade tool.
- **No vendoring**: `node_modules/` is gitignored; dependencies are fetched from the public npm registry on install. There is no `vendor/`, `third_party/`, or similar directory for bundled JS.
- **No private registry / auth**: No `.npmrc`, `npmrc`, `yarnrc`, or `package.json` `publishConfig.registry` was found; all packages are sourced from the default public npm registry.
- **Lockfile discipline**: `package-lock.json` is present and should be kept in sync with `package.json` changes to guarantee deterministic builds.
- **Plugin alignment convention**: Every Expo plugin used in `app.json` has a matching entry in `package.json` (e.g. `expo-camera`, `expo-location`, `expo-splash-screen`), ensuring the manifest stays consistent with installed packages.

## Constraints & Rules Observed

- Dependencies are managed exclusively by npm; scripts like `start`, `android`, `ios`, `web`, and `lint` invoke `expo` CLI commands rather than custom dependency tooling.
- Generated/native artifacts (`node_modules`, `.expo`, `/ios`, `/android`, `dist/`, `web-build/`) are excluded from version control — only manifests and lockfiles are tracked.
- The project is marked `"private": true` in `package.json`, indicating it is not published to any registry.
- No dependency-audit or update automation (e.g. Dependabot, Renovate, `npm audit`, `npm outdated`) was detected in the repository surface examined.