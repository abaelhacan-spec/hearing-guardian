---
name: Hearing Guardian build rules
description: Mandatory compatibility and build-stability rules set by the user — must be followed every session without exception.
---

# Hearing Guardian — Mandatory Project Rules

**Why:** The user has experienced build failures and version conflicts before. These rules exist to prevent that from recurring.

**How to apply:** Before any implementation step, verify the action against these rules. Non-compliance is not acceptable.

## Package Installation
- Always use `npx expo install <package>` — never `npm install` or `pnpm add` for Expo packages.
- Before adding any library: verify compatibility with current Expo SDK + React Native + React versions.
- No deprecated or unsupported libraries.
- Native libraries must be confirmed compatible with EAS Build and Expo Development Build.

## Core Files — Touch Only When Necessary
These files must NOT be modified unless strictly required, with a written reason:
- `app.json`, `app.config.js`, `app.config.ts`
- `package.json`, `eas.json`
- `babel.config.js`, `metro.config.js`, `tsconfig.json`
- `plugins/`

## Expo Plugins & Config Plugins
- Only add if the library officially requires it. No unnecessary plugins.

## package.json hygiene
- No unused dependencies.
- No duplicate versions of the same library.
- No outdated versions when stable modern ones exist.

## Definition of Done (per task)
A task is only complete when the project passes all three:
1. TypeScript — zero errors
2. Expo Doctor — no issues
3. Metro Bundler — bundles successfully

## Build targets to maintain at all times
- Android (local dev build)
- EAS Build (cloud)

## Project identity
- App: Hearing Guardian
- Stack: Expo SDK (latest stable) + React Native + Kotlin (Expo Modules API)
- Kotlin role: pure event bridge only, zero app logic
- All logic in TypeScript/React Native
