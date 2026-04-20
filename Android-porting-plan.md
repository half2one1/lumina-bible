# Lumina Bible: The Grand Android Porting Plan

This document provides a professional-grade roadmap for transitioning the Lumina Bible from an iOS/Desktop app to a full-featured Android application. It moves beyond infrastructure setup into application-specific integration logic.

---

## 🟢 Phase 1: Professional Infrastructure (The Foundation)

### 1. The Environment (macOS Setup)
Before touching the code, your Mac Mini must be a valid Android Build Station.
- **Install Homebrew Java 17**: `brew install openjdk@17`
- **Android Studio Settings**: 
  - Install **NDK (Side-by-Side)** and **CMake** from the SDK Manager.
  - Verification: `adb devices` must show your phone.

### 2. Rust Mobile Targets
Compile the Rust logic for all Android architectures:
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

---

## 🟡 Phase 2: Lumina-Specific Application Logic

### 1. Hardware Back Button Handling
Android users expect the hardware back button to return to the previous chapter or search result. By default, it might just minimize the app.
- **Pro Fix**: Use the `tauri-plugin-app-events` plugin.
- **Implementation**:
  - Register a listener in `App.tsx` that checks if a modal/drawer is open.
  - If open, close the drawer. If not, trigger the `history.back()` logic for the Bible chapters.

### 2. Edge-to-Edge & Safe Areas
Modern Android apps should be "Edge-to-Edge" (content behind status/navigation bars).
- **Tool**: `tauri-plugin-edge-to-edge`.
- **CSS Strategy**: Update `index.css` to use Android-provided safe area variables:
  ```css
  body {
    padding-top: var(--safe-area-inset-top);
    padding-bottom: var(--safe-area-inset-bottom);
  }
  ```

### 3. Metadata Loading Optimization
Lumina Bible relies on 66+ book records. Android WebViews can be more memory-constrained than iOS.
- **Strategy**: Ensure `BIBLE_BOOKS` is imported efficiently and that search indexing (if done on the JS side) is debounced to prevent UI lag on mid-range Android devices.

---

## 🟠 Phase 3: Tauri v2 Capabilities & Security

Tauri v2 uses a strict **Capability** system. You must explicitly allow Android to access local files or settings.
- **Action**: Create `src-tauri/capabilities/android.json`.
- **Config**:
  ```json
  {
    "identifier": "android-capability",
    "windows": ["main"],
    "permissions": ["core:default", "app-events:default"],
    "platforms": ["android"]
  }
  ```

---

## 🔴 Phase 4: Pro Debugging & Problem Solving

### 1. The "ADB Logcat" Technique
If the app crashes on Android but works on Web:
```bash
adb logcat *:S tauri:V Rust:V
```
This filters logs to show only Tauri and Rust-specific output, which is the "Pro" way to debug native panics.

### 2. Physical Device Networking (The Subnet Trap)
- **Problem**: Physical phones cannot reach `localhost`.
- **Solution**: Set `devUrl` in `tauri.conf.json` to your Mac's Wi-Fi IP (e.g., `192.168.219.118`).

### 3. Android Splash Screen
Unlike iOS, Android 12+ has a specific Splash Screen API.
- **Setup**: You will need to configure `res/values/themes.xml` inside the generated Android project to ensure the splash screen matches the Lumina branding.

---

## 🟣 Phase 5: Build & Production (AAB vs APK)
When you're ready for the App Store (Google Play):
- **Target**: Use `npm run tauri:build -- --target aarch64-linux-android`.
- **Artifact**: Generate an `.aab` (Android App Bundle) which Google Play uses to optimize the download for every specific phone.

---

## 🚀 Recommended First Step
1. Install **Android Studio** and **NDK**.
2. Run `npx tauri android init`.
3. Stop and verify that the `gen/android` folder is created successfully.
