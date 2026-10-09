#!/usr/bin/env bash
# Build and install the StageVibe Flatpak locally.
#
# Prerequisites:
#   - flatpak + flatpak-builder
#   - runtimes: org.freedesktop.Platform/Sdk 25.08,
#               org.electronjs.Electron2.BaseApp 25.08
#     flatpak install flathub org.electronjs.Electron2.BaseApp//25.08
#
# Usage:
#   pnpm -F stagevibe make:release   # produce the Linux bundle first
#   packaging/flatpak/build.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
app="$root/apps/browser/out/release/stagevibe-linux-x64"

if [ ! -x "$app/stagevibe" ]; then
  echo "error: release bundle not found at $app" >&2
  echo "       run 'pnpm -F stagevibe make:release' first." >&2
  exit 1
fi

if ! command -v flatpak-builder >/dev/null 2>&1; then
  echo "error: flatpak-builder is not installed." >&2
  exit 1
fi

exec flatpak-builder \
  --force-clean \
  --user \
  --install \
  "$here/build-dir" \
  "$here/eu.deepvibe.StageVibe.yml"
