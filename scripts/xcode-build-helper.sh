#!/bin/bash
# Lumina Bible Xcode Build Helper
# This script ensures the full development environment is loaded before running the Tauri build.

# 1. Expand PATH to include common tool locations
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PATH="$PATH:$HOME/.cargo/bin"

# 2. Logging setup
LOG_FILE="/tmp/lumina-xcode-build.log"
echo "--- Build started at $(date) ---" > "$LOG_FILE"
echo "PATH: $PATH" >> "$LOG_FILE"
echo "Current directory: $(pwd)" >> "$LOG_FILE"

# 3. Verify key tools
function check_tool() {
  if ! command -v "$1" &> /dev/null; then
    echo "ERROR: $1 not found. Please ensure it is installed and in the PATH." >> "$LOG_FILE"
    echo "ERROR: $1 not found." >&2
    exit 1
  fi
}

check_tool "node"
check_tool "npm"
check_tool "cargo"
check_tool "rustc"

# 4. Run the Tauri Build Script
# We pass through all the standard Xcode environment variables
echo "Executing tauri ios xcode-script..." >> "$LOG_FILE"

# Use absolute path to npm to be safe
NPM_PATH=$(command -v npm)

$NPM_PATH run -- tauri ios xcode-script \
  --platform "${PLATFORM_DISPLAY_NAME:?}" \
  --sdk-root "${SDKROOT:?}" \
  --framework-search-paths "${FRAMEWORK_SEARCH_PATHS:?}" \
  --header-search-paths "${HEADER_SEARCH_PATHS:?}" \
  --gcc-preprocessor-definitions "${GCC_PREPROCESSOR_DEFINITIONS:-}" \
  --configuration "${CONFIGURATION:?}" \
  ${FORCE_COLOR} \
  ${ARCHS:?} 2>&1 | tee -a "$LOG_FILE"

# 5. Check exit status
STATUS=${PIPESTATUS[0]}
echo "Build finished with status: $STATUS" >> "$LOG_FILE"

if [ $STATUS -ne 0 ]; then
  echo "Build failed. Check $LOG_FILE for details." >&2
  exit $STATUS
fi

exit 0
