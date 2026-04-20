# Implementation Plan: Resolve Xcode Build & Deployment Failures

This plan addresses the recurring `Command PhaseScriptExecution failed` error by hardening the environment configuration and ensuring the project is ready for iOS deployment (both Simulator and Physical Device).

## User Review Required

> [!IMPORTANT]
> **Physical Device Requirement**: To run the app on your iPhone, you **must** provide a Development Team ID. If you provide one, I will add it to `tauri.conf.json`.
> 
> **Simulator Alternative**: If you do not have a Team ID, we will configure the project to default to a Simulator (e.g., iPhone 17 Pro) which does not require code signing for development.

## Proposed Changes

### 1. Tauri Configuration
#### [MODIFY] [tauri.conf.json](file:///Users/myhomemacminiagent/Projects/lumina-bible/src-tauri/tauri.conf.json)
- Add `developmentTeam` to the `bundle > iOS` section.
- Ensure `identifier` matches the expected bundle ID.

### 2. Xcode Build Script Hardening
#### [MODIFY] [project.pbxproj](file:///Users/myhomemacminiagent/Projects/lumina-bible/src-tauri/gen/apple/app.xcodeproj/project.pbxproj)
- Refine the `shellScript` in the "Build Rust Code" phase to be more robust.
- Add diagnostic logging so the exact failure point (e.g., "npm not found") is displayed in the build output if it fails again.
- Use an absolute path to a new helper script to avoid escaping issues in the massive `.pbxproj` file.

### 3. Build Helper Script [NEW]
#### [NEW] [scripts/xcode-build-helper.sh](file:///Users/myhomemacminiagent/Projects/lumina-bible/scripts/xcode-build-helper.sh)
- A dedicated shell script that:
    1. Loads the full environment (Homebrew, Cargo, NVM if applicable).
    2. Verifies all tools are present.
    3. Executes the Tauri build command with detailed logging.

## Verification Plan

### Automated Tests
- Run `npm run tauri:ios` and monitor the build logs for "Build Rust Code" phase success.

### Manual Verification
- Confirm the app launches on the selected target (Simulator or Device).
- Verify that changes in `App.tsx` are correctly reflected in the build.
