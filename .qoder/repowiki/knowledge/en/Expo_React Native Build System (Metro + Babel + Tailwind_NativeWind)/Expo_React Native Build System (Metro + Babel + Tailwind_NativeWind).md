---
kind: build_system
name: Expo/React Native Build System (Metro + Babel + Tailwind/NativeWind)
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - app.json
    - metro.config.js
    - babel.config.js
    - tailwind.config.js
    - scripts/reset-project.js
    - .env.example
---

## What system/approach is used

DermSight is a React Native / Expo application built with the standard Expo toolchain. The build pipeline is entirely driven by npm scripts in `package.json` that invoke `expo start`, `expo lint`, and platform-specific entry points (`--android`, `--ios`, `--web`). There are no Makefiles, Dockerfiles, CI pipelines, or release automation scripts in this repository — builds are intended to be run locally via `npx expo start`.

The bundler stack is:
- **Metro** (via `expo/metro-config`) as the JavaScript bundler.
- **Babel** using `babel-preset-expo` with `jsxImportSource: "nativewind"` so JSX compiles through NativeWind's transform.
- **Tailwind CSS** configured for NativeWind via `nativewind/preset`, with source scanning limited to `./src/**/*.{js,jsx,ts,tsx}`.

## Key files and packages

- `package.json` — declares all runtime dependencies (Expo ~57, React Native 0.86, Drizzle ORM, Supabase, Zustand, i18next, etc.), dev dependencies (TypeScript ~6), and the four npm scripts: `start`, `android`, `ios`, `web`, `lint`, plus a one-off `reset-project` script.
- `app.json` — Expo config: app name/slug/version, bundle identifiers (`com.dermsight.app`), splash screen assets, Android permissions (CAMERA, location, storage), web output set to `static` with Metro bundler, and enabled experiments (`typedRoutes`, `reactCompiler`).
- `metro.config.js` — extends default Expo Metro config and wraps it with `withNativeWind`, pointing at `./global.css` as the Tailwind input.
- `babel.config.js` — single preset `babel-preset-expo` with `jsxImportSource: "nativewind"`.
- `tailwind.config.js` — defines project color tokens (`primary`, `navy`, `risk`, `surface`), font family (`System`), and the NativeWind preset.
- `scripts/reset-project.js` — interactive Node script that moves/deletes `src/` and `scripts/` into an `example/` folder and scaffolds a fresh `src/app/index.tsx` + `_layout.tsx`; invoked via `npm run reset-project`.
- `.env.example` — template for environment variables (consumed by Expo at build time).

## Architecture and conventions

- **Single-package monorepo**: there is only one `package.json`; no workspace or subproject structure.
- **Expo Router file-based routing**: the `main` entry is `expo-router/entry`, and screens live under `src/app/` following Expo Router conventions (`(app)`, `(auth)` route groups, `_layout.tsx` per group).
- **Platform configuration is declarative**: iOS bundle ID, Android package name, permissions, splash images, and plugin configurations (splash-screen, location, camera) are all declared in `app.json` rather than edited directly in native project files.
- **Styling pipeline**: global styles flow through `global.css` → Tailwind (via `tailwind.config.js`) → NativeWind Metro/Babel transforms → Metro bundle. Custom design tokens are centralized in `tailwind.config.js`.
- **Versioning**: app version lives in two places and must be kept in sync — `package.json#version` and `app.json#expo.version` (both currently `1.0.0`).
- **No pre/post-install hooks**: there are no `preinstall`, `postinstall`, `prebuild`, or `postbuild` scripts; dependency installation is a plain `npm install`.

## Conventions and constraints

- Development server is started exclusively through `npm run start` (which runs `expo start`); platform-specific development uses `npm run android` / `npm run ios` / `npm run web`.
- Linting is done via `npm run lint` which invokes `expo lint`; no custom ESLint/Prettier config is present in this repo (the README references external guides for setting them up).
- TypeScript is configured via `tsconfig.json` (present at root) and compiled by the Expo toolchain; no separate `tsc` build step is defined in scripts.
- Web builds target static output (`app.json#web.output = "static"`) using Metro as the bundler.
- Environment variables are expected to be provided via `.env` (template in `.env.example`); no build-time variable substitution beyond what Expo supports natively.
- There is no CI/CD, Docker, EAS Build, or release automation present in this repository snapshot. The `ARCHITECTURE.md` mentions an `eas.json` file, but it is not included in the checked-out tree, so EAS cloud builds are not part of the current build surface.