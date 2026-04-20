# The Complete Guide: Porting Tauri Apps to Physical iOS Devices

Deploying a Tauri v2 application to a physical iPhone requires navigating Apple's strict security, provisioning systems, and local network complexities. This document serves as a complete reference guide, from zero to deployment, including how to fix catastrophic build failures based on our hands-on experience.

---

## 1. Prerequisites: Installing & Setting Up Xcode
Before you can compile anything for iOS, your Mac must be properly configured with Apple's development tools.

### Step 1: Install Xcode
*   Download and install **Xcode** from the Mac App Store. (Note: This is a massive download and may take a while).
*   Launch Xcode at least once to allow it to install additional required components.

### Step 2: Configure Command Line Tools
Tauri relies on terminal commands to interact with Xcode. You must ensure your terminal is pointing to the full Xcode app, not just the standalone command-line tools.
Run these commands in your terminal:
```bash
# Set the active developer directory to the full Xcode app
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Accept the Xcode license agreement on behalf of the system
sudo xcodebuild -license accept
```

---

## 2. Apple Developer Account & Code Signing
Apple requires all apps installed on a physical device to be digitally signed.

### Step 1: Sign in to Xcode
1. Open Xcode and go to **Xcode Menu > Settings...** (or press `Cmd + ,`).
2. Navigate to the **Accounts** tab.
3. Click the **`+`** button in the bottom left, select **Apple ID**, and log in.
4. Your account will now display a **Team ID** (a 10-character code like `QLBS43TRDQ`). Note this down.

### Step 2: Configure the Xcode Project
1. Open your Tauri project in Xcode:
   ```bash
   open src-tauri/gen/apple/app.xcodeproj
   ```
2. In the left panel, click on the **app** folder at the very top.
3. In the middle area, select your **app_iOS** Target.
4. Go to the **Signing & Capabilities** tab.
5. Check the box for **"Automatically manage signing"**.
6. Select your account from the **Team** dropdown.
7. *Crucial:* Ensure your Bundle Identifier (e.g., `com.yourname.appname`) is globally unique. If Xcode shows red warnings, change the identifier until it successfully generates a Provisioning Profile.

---

## 3. Running the Build
With Xcode configured, you can build and run the app from your terminal.

**To run on a Simulator (No Apple ID required):**
```bash
npm run tauri:ios -- --target "iPhone 16 Pro"
```

**To run on a connected Physical iPhone:**
```bash
# Connect your iPhone via USB and unlock it
npm run tauri:ios
```
*Note: On your iPhone, you may need to go to **Settings > General > VPN & Device Management** to "Trust" your Apple Developer certificate before the app will open.*

---

## 4. The Nuclear Options: Cleaning & Resetting
If the build is failing for an unknown reason, Xcode caches or corrupted Tauri generated files are usually to blame. Use these methods to reset your state.

### Level 1: Standard Clean
If Xcode is acting strange, clean the build cache:
1. Open the project in Xcode.
2. Press `Cmd + Shift + K` (Product > Clean Build Folder).
3. Try building again.

### Level 2: Purge Generated Project (Tauri Reset)
If `project.pbxproj` is fundamentally broken or misconfigured:
1. Delete the generated Apple folder:
   ```bash
   rm -rf src-tauri/gen/apple
   ```
2. Re-run `npm run tauri:ios`. Tauri will regenerate the entire Xcode project from scratch. (Note: You will have to re-select your Team ID in Xcode).

### Level 3: Nuke Derived Data (The Last Resort)
Xcode stores intermediate build files deeply in your system. If a build inexplicably fails with caching errors:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

---

## 5. Known Pitfalls & Solutions (Based on Experience)

### Pitfall A: The `PhaseScriptExecution` Error (Sandbox Isolation)
**Symptoms**: Build fails with exit code `65` or `72`. Logs say `npm not found` or `cargo not found`.
**Why**: Xcode executes build phase scripts in a highly restricted sandbox that does not inherit your normal terminal's `PATH`.
**The Fix**:
Create a dedicated proxy script (`scripts/xcode-build-helper.sh`) that manually injects your system paths:
```bash
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.cargo/bin"
# Call the tauri xcode-script here...
```
Then, update the `shellScript` value in `project.pbxproj` to execute this helper file.

### Pitfall B: Code Signing Conflicts
**Symptoms**: `No Account for Team` or `No profiles found`.
**Why**: Hardcoding `"developmentTeam": "YOUR_ID"` in `tauri.conf.json` attempts to violently override Xcode's native profile generation mid-build.
**The Fix**: Remove `developmentTeam` entirely from `tauri.conf.json`. Let Xcode "Automatically manage signing" natively in its GUI.

### Pitfall C: The "Blank Black Screen" on Launch
**Symptoms**: App installs on phone successfully, opens, but only shows a blank screen.
**Why**: `tauri ios dev` does not compile your frontend code into the app. It runs a Vite server on your Mac and instructs the iPhone app to fetch the UI over your Local Area Network (LAN) via a specific IP address (e.g. `192.168.25.53`).
**The Fixes**:
1. **Network Mismatch**: Ensure your Mac and iPhone are structurally on the *exact same subnet*. If your Mac is on Ethernet (`192.168.25.x`) and the iPhone is on a different Wi-Fi VLAN (`192.168.219.x`), it will fail. Set `"devUrl": "http://192.168.219.YOUR_MAC_IP:3000"` in `tauri.conf.json` to force the correct network interface.
2. **Local Network Privacy**: iOS explicitly blocks apps from scanning or connecting to local network IPs until permitted. If you deny the initial prompt: *"App would like to find and connect to devices on your local network,"* the app will permanently blank screen. Go to iPhone **Settings > Privacy > Local Network** and toggle the app ON.
3. **Port Zombies**: If a ghost Node process is holding port `3000`, run `lsof -t -i:3000 | xargs kill -9` to free it before launching.
