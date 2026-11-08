#!/usr/bin/env bash
set -euo pipefail
LABEL="com.singhstudio.clipper"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
echo "Service removed. Your data in ~/Clipper was left untouched."
