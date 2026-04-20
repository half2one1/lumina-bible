# Android Development Setup — Lumina Bible

This guide covers everything needed to build and run Lumina Bible on Android.

---

## Prerequisites

### 1. macOS System Requirements
- macOS 13+ (Ventura or later)
- Homebrew installed
- Node.js 18+ and npm
- Rust toolchain (rustup)

### 2. Java 17 (OpenJDK)
```bash
brew install openjdk@17

# Add to your shell profile (~/.zshrc or ~/.bashrc):
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Verify:
java --version   # Should show 17.x
```

> **Note**: If you have sudo access, you can also symlink for system-wide discovery:
> ```bash
> sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
> ```

### 3. Android SDK & NDK

#### Option A: Android Studio (Recommended for physical device debugging)
1. Download and install [Android Studio](https://developer.android.com/studio)
2. Open SDK Manager (Settings > Languages & Frameworks > Android SDK)
3. Install:
   - **SDK Platforms**: Android 14 (API 34)
   - **SDK Tools**: Android SDK Build-Tools 34, NDK (Side by side) 27.x, Android SDK Platform-Tools

#### Option B: Command-Line Only (Headless / CI)
```bash
brew install --cask android-commandlinetools

export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.0.12077973"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

# Install SDK components:
yes | sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "ndk;27.0.12077973"
```

### 4. Rust Android Targets
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### 5. Shell Profile (Complete)
Add all of this to `~/.zshrc`:
```bash
# Java 17
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.0.12077973"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

Then reload: `source ~/.zshrc`

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/half2one1/lumina-bible.git
cd lumina-bible
git checkout feature/android-port
npm install

# 2. Find your Mac's local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 3. Update devUrl in src-tauri/tauri.conf.json to your IP:
#    "devUrl": "http://YOUR_IP:3000"

# 4. Run on Android device/emulator
npm run tauri:android
```

---

## Physical Device Setup

### USB Debugging
1. On your Android phone: **Settings > About Phone > tap "Build Number" 7 times** to enable Developer Options
2. Go to **Settings > Developer Options > enable "USB Debugging"**
3. Connect phone via USB cable
4. Verify: `adb devices` should show your device

### Network Configuration (Critical!)
Physical Android devices **cannot reach `localhost`**. The dev server must be accessible over the local network:
1. Find your Mac's IP: `ifconfig en0 | grep "inet "`
2. Set `devUrl` in `src-tauri/tauri.conf.json` to `http://YOUR_MAC_IP:3000`
3. Make sure your Mac and Android phone are on the **same Wi-Fi network / subnet**

---

## Emulator Setup (No Physical Device)

```bash
# Create an emulator via Android Studio or CLI:
avdmanager create avd -n "Pixel_7" -k "system-images;android-34;google_apis;arm64-v8a" -d "pixel_7"

# Download system image first if needed:
sdkmanager "system-images;android-34;google_apis;arm64-v8a"

# Launch emulator:
emulator -avd Pixel_7
```

For emulators, you can use `http://10.0.2.2:3000` as the `devUrl` (Android emulator's alias for host machine's localhost).

---

## Building for Production

```bash
# Build release APK/AAB
npm run tauri:build -- --target aarch64-linux-android

# The .aab (Android App Bundle) for Google Play will be at:
# src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab
```

---

## Debugging

### ADB Logcat (Filtered for Tauri)
```bash
adb logcat *:S tauri:V Rust:V
```

### Common Issues

| Problem | Solution |
|---------|----------|
| **Blank white screen** | Check `devUrl` is your Mac's IP, not `localhost`. Verify same Wi-Fi network. |
| **`JAVA_HOME` not set** | Add `export JAVA_HOME=...` to `~/.zshrc` and reload |
| **NDK not found** | Ensure `NDK_HOME` points to exact NDK version directory |
| **Build fails on Rust compilation** | Run `rustup target add aarch64-linux-android` |
| **`adb devices` shows nothing** | Enable USB debugging on phone. Try `adb kill-server && adb start-server` |
| **Gradle sync fails** | Delete `src-tauri/gen/android/.gradle` and retry |
| **App crashes immediately** | Check `adb logcat` for panic messages. Common cause: missing Bible data files |

### Nuclear Reset
```bash
# Remove generated Android project and reinitialize
rm -rf src-tauri/gen/android
npx tauri android init

# Clear Gradle caches
rm -rf ~/.gradle/caches
```

---

## Project Structure (Android-Specific)

```
src-tauri/
  gen/android/                    # Auto-generated Gradle project
    app/
      build.gradle.kts           # App-level build config (SDK versions, deps)
      src/main/
        AndroidManifest.xml       # App permissions and metadata
        res/                      # Android resources (icons, themes, layouts)
          mipmap-*/               # App icons (multiple densities)
          values/                 # Theme XML
  capabilities/
    android.json                  # Tauri v2 Android-specific permissions
  tauri.conf.json                 # Cross-platform config (devUrl, bundle settings)
```

> **Important**: Do NOT manually edit files under `src-tauri/gen/android/` unless absolutely necessary. These are regenerated by `tauri android init`.

---

## For AI Coding Agents (Google Antigravity / Jules / etc.)

If you are an AI agent working on this project:

1. **Read `CLAUDE.md`** first — it contains the full project architecture and rules
2. **Environment setup**: Ensure `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` are exported before any Tauri commands
3. **Test changes**: Always run `npm run build` to verify TypeScript/Vite builds succeed
4. **Do not edit `src-tauri/gen/`** — these are auto-generated files
5. **devUrl matters**: If you're running on a physical device, the `devUrl` must be the host machine's LAN IP, not `localhost`
6. **The frontend is shared**: `src/App.tsx` is the same code for Desktop, iOS, and Android. Platform-specific behavior should use feature detection, not separate codepaths where possible
