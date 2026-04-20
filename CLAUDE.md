# Lumina Bible — Agent Collaboration Guide

## Project Overview
Lumina Bible is a cross-platform bilingual Bible reader built with **Tauri v2** (Rust backend) + **React 19** (TypeScript frontend). It displays original-language scriptures (Hebrew, Arabic, Greek) alongside English (KJV) and Korean translations.

## Architecture

### Directory Structure
```
src/                    # React frontend (shared across ALL platforms)
  App.tsx               # Main single-page app (~1000 lines, state-driven navigation)
  main.tsx              # React entry point
  index.css             # Tailwind v4 + theme system (light/dark/sepia)
  data/
    bibleStructure.ts   # 66 book metadata, 3 base languages (HE, AR, GR)
    bibleService.ts     # Fetches JSON bible data from /public/data/
    bibleData.ts        # Data utilities
src-tauri/              # Tauri v2 Rust backend
  src/lib.rs            # Mobile entry point (#[cfg_attr(mobile, tauri::mobile_entry_point)])
  src/main.rs           # Desktop entry point
  Cargo.toml            # Rust deps: tauri 2.10.3, tauri-plugin-log
  tauri.conf.json       # App config, build URLs, bundle settings
  capabilities/         # Tauri v2 permission files
    default.json        # Desktop/general permissions
    android.json        # Android-specific permissions
  gen/
    apple/              # Generated iOS/macOS Xcode project (DO NOT manually edit)
    android/            # Generated Android Gradle project (DO NOT manually edit)
public/data/            # Bible JSON files (fetched at runtime)
components/ui/          # shadcn components (Button, Input, Sheet, Badge, etc.)
```

### Key Technical Decisions
- **No router library** — navigation is state-driven (useState for book/chapter/search)
- **localStorage** for all persistence (reading progress, preferences, search cache)
- **Tailwind v4** with CSS custom properties for runtime theming
- **Safe area insets** via `env(safe-area-inset-*)` — works on both iOS and Android
- **Font system**: Inter (UI), Noto Sans Hebrew, Noto Naskh Arabic, Noto Sans KR

### Build & Dev Commands
```bash
npm run dev              # Start Vite dev server (port 3000, host 0.0.0.0)
npm run build            # Production build → dist/
npm run tauri:dev        # Desktop dev mode
npm run tauri:build      # Desktop production build
npm run tauri:ios        # iOS dev mode (requires Xcode)
npm run tauri:android    # Android dev mode (requires Android SDK)
```

### Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key (loaded via Vite's loadEnv)
- `DISABLE_HMR=true` — Disables hot module replacement (for AI agent editing)
- `JAVA_HOME` — Must point to JDK 17 for Android builds
- `ANDROID_HOME` — Android SDK root (`~/Library/Android/sdk`)
- `NDK_HOME` — Android NDK path (`$ANDROID_HOME/ndk/27.0.12077973`)

### Mobile Development
- **devUrl** in `tauri.conf.json` must be your machine's local IP (not `localhost`) for physical device testing
- iOS: open `src-tauri/gen/apple/app.xcodeproj` in Xcode for signing
- Android: open `src-tauri/gen/android/` in Android Studio for device management

## Rules for AI Agents

### DO
- Read existing code before modifying — the app is a single large `App.tsx`
- Preserve the existing theme system (CSS custom properties with `data-theme` attributes)
- Test with `npm run build` after changes to ensure no TypeScript/build errors
- Use `env(safe-area-inset-*)` for any new mobile-facing UI
- Keep localStorage keys prefixed with `lumina-`

### DO NOT
- Manually edit files under `src-tauri/gen/` — these are auto-generated
- Add a router library — the single-page state-driven approach is intentional
- Remove or modify the iOS configuration when working on Android (and vice versa)
- Add new npm dependencies without explicit approval
- Modify `Cargo.toml` dependencies without explicit approval
- Touch the `public/data/` Bible JSON files — they are source data

### Code Style
- TypeScript strict mode, React functional components with hooks
- Tailwind utility classes preferred over custom CSS
- `useCallback` for event handlers passed as props
- No semicolons in import statements (project convention varies — match surrounding code)

## Platform Status
| Platform | Status |
|----------|--------|
| Desktop (macOS/Windows/Linux) | Production-ready |
| iOS | Production-ready (App Store) |
| Android | Development (initial port on `feature/android-port` branch) |
