# How Tauri Manages Cross-Platform Development

A common concern when adding a new platform (like Android) to an existing project (like iOS) is whether the original work will become obsolete. In Tauri v2, the architecture is designed to ensure that mobile and desktop platforms coexist perfectly within the same codebase.

---

## 1. Single Source of Truth (Shared Code)
Most of your application lives in two "shared" locations. When you edit these, the changes apply to **all** platforms simultaneously:

*   **Frontend (`src/`)**: Your React components, Tailwind styles, and UI logic.
*   **Backend Logic (`src-tauri/src/`)**: Your Rust logic, state management, and custom commands.

Whether you run the app on an iPhone, an Android phone, or a Mac, they all "drink from the same well."

---

## 2. Side-by-Side Platform Generation
Tauri handles the native "glue" code for each platform by generating separate, isolated folders inside `src-tauri/gen/`.

*   **iOS/macOS**: Lives in `src-tauri/gen/apple/`. This contains the `.xcodeproj` file and Apple-specific metadata (Team IDs, Provisioning Profiles).
*   **Android**: Lives in `src-tauri/gen/android/`. This contains the Gradle build system and Kotlin/Java wrapper code.

**Key Fact**: Initializing Android creates its own `gen/android` folder. It **never touches** your `gen/apple` folder. Your iOS settings remain completely safe and untouched.

---

## 3. Platform-Specific Differentiation (If Needed)
While 95% of your code is shared, you can easily write logic that only runs on one platform:

### In JavaScript/React:
```javascript
import { type } from '@tauri-apps/plugin-os';
const platformName = type(); // returns 'android', 'ios', 'macos', etc.

if (platformName === 'android') {
  // Do Android-specific back-button handling
}
```

### In Rust:
```rust
#[cfg(target_os = "android")]
fn android_specific_logic() {
  // Only compiles for Android
}

#[cfg(target_os = "ios")]
fn ios_specific_logic() {
  // Only compiles for iOS
}
```

---

## 4. Multi-Platform Tauri Config
Your `tauri.conf.json` file is the central control tower. It has dedicated blocks for each mobile platform:
```json
"bundle": {
  "iOS": { "developmentTeam": "..." },
  "android": { "projectPath": "..." }
}
```
This allows you to maintain different developers, bundle IDs, and minimum OS versions for each platform within the same file.

---

## Conclusion
Adding Android is an **expansion**, not a replacement. Your Lumina Bible project is evolving from a specialized app into a universal one, all while maintaining the exact same UI and logic across every screen.
