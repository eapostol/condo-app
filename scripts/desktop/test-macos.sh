#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [[ "${OSTYPE:-}" != darwin* ]]; then
  echo "This script must be run on macOS."
  exit 1
fi

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_command node
require_command npm
require_command docker
require_command ditto
require_command open

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop is not running. Open Docker Desktop and wait until it is fully started."
  exit 1
fi

ARCH_OVERRIDE="${1:-}"
MAC_ARCH=""

if [[ -n "${ARCH_OVERRIDE}" ]]; then
  case "${ARCH_OVERRIDE}" in
    arm64|x64)
      MAC_ARCH="${ARCH_OVERRIDE}"
      ;;
    *)
      echo "Invalid architecture override: ${ARCH_OVERRIDE}"
      echo "Use: arm64 or x64"
      exit 1
      ;;
  esac
else
  case "$(uname -m)" in
    arm64)
      MAC_ARCH="arm64"
      ;;
    x86_64)
      MAC_ARCH="x64"
      ;;
    *)
      echo "Unsupported macOS CPU architecture: $(uname -m)"
      exit 1
      ;;
  esac
fi

DESKTOP_ENV_FILE="${REPO_ROOT}/desktop.env"
if [[ ! -f "${DESKTOP_ENV_FILE}" ]]; then
  echo "desktop.env was not found at ${DESKTOP_ENV_FILE}"
  exit 1
fi

IMAGE_REF="$(grep '^CONDO_APP_IMAGE=' "${DESKTOP_ENV_FILE}" | cut -d'=' -f2-)"
if [[ -z "${IMAGE_REF}" ]]; then
  echo "CONDO_APP_IMAGE is not set in desktop.env"
  exit 1
fi

IMAGE_TAG="${IMAGE_REF##*:}"
RELEASE_ZIP="${REPO_ROOT}/releases/condo-management-portal-${IMAGE_TAG}-darwin.zip"
TEST_ROOT="${HOME}/Desktop/condo-launcher-test"
EXTRACT_ROOT="${TEST_ROOT}/condo-management-portal-${IMAGE_TAG}-darwin"

echo "Repo root: ${REPO_ROOT}"
echo "Using image: ${IMAGE_REF}"
echo "Packaging architecture: ${MAC_ARCH}"

cd "${REPO_ROOT}"

unset ELECTRON_RUN_AS_NODE || true

echo
echo "1. Installing dependencies"
npm run install:all

echo
echo "2. Packaging macOS launcher"
npm --prefix launcher run package:mac -- --arch="${MAC_ARCH}"

echo
echo "3. Assembling macOS release zip"
npm run desktop:release:mac

if [[ ! -f "${RELEASE_ZIP}" ]]; then
  echo "Expected release zip was not created: ${RELEASE_ZIP}"
  exit 1
fi

echo
echo "4. Extracting release bundle to ${TEST_ROOT}"
rm -rf "${TEST_ROOT}"
mkdir -p "${TEST_ROOT}"
ditto -x -k "${RELEASE_ZIP}" "${TEST_ROOT}"

APP_PATH="$(find "${EXTRACT_ROOT}/Desktop Launcher" -maxdepth 1 -name '*.app' -print -quit)"
if [[ -z "${APP_PATH}" ]]; then
  echo "Could not find the packaged macOS app inside ${EXTRACT_ROOT}/Desktop Launcher"
  exit 1
fi

echo
echo "5. Opening launcher app"
open "${APP_PATH}"

echo
echo "Done."
echo "Launcher app: ${APP_PATH}"
echo "Release zip: ${RELEASE_ZIP}"
echo
echo "Next steps:"
echo "- If macOS blocks the app, right-click it in Finder and choose Open."
echo "- In the launcher, click Start."
echo "- The app should open at http://localhost:3000"
