#!/usr/bin/env bash
# Installs clipper as a per-user launchd service on macOS.
#   ./macos/install.sh            install / update and (re)start
#   ./macos/install.sh --power    also apply "never sleep, restart after power loss" (sudo)
set -euo pipefail

APP="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${CLIPPER_ROOT:-$HOME/Clipper}"
VENV="$ROOT/.venv"
LABEL="com.singhstudio.clipper"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

[[ "$(uname)" == "Darwin" ]] || { echo "macOS only"; exit 1; }
command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }

echo "==> system packages"
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
brew list yt-dlp >/dev/null 2>&1 || brew install yt-dlp
PY="$(brew --prefix)/bin/python3.12"
[[ -x "$PY" ]] || { brew install python@3.12; }

echo "==> python env at $VENV"
mkdir -p "$ROOT"
[[ -d "$VENV" ]] || "$PY" -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
EXTRAS="youtube,download"
[[ "$(uname -m)" == "arm64" ]] && EXTRAS="$EXTRAS,whisper-mlx" || EXTRAS="$EXTRAS,whisper"
"$VENV/bin/pip" install -q -e "$APP[$EXTRAS]"

echo "==> folders + config"
CLIPPER_CONFIG="$ROOT/config.yaml" "$VENV/bin/python" -m clipper init

echo "==> launchd agent"
mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/logs"
sed -e "s#__VENV__#$VENV#g" -e "s#__APP__#$APP#g" -e "s#__ROOT__#$ROOT#g" \
  "$APP/macos/$LABEL.plist.template" > "$PLIST"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

if [[ "${1:-}" == "--power" ]]; then
  echo "==> power settings (sudo)"
  sudo pmset -a sleep 0 disksleep 0 displaysleep 10 autorestart 1 womp 1 powernap 0
fi

cat <<MSG

Installed. Service: $LABEL   Logs: $ROOT/logs/clipper.log
Next:
  1. Edit $ROOT/config.yaml and $ROOT/sources.yaml
  2. $VENV/bin/clipper doctor
  3. $VENV/bin/clipper auth youtube      (and tiktok)
  4. Leave publish.dry_run: true for a day, check $ROOT/state/dry_run_posts.jsonl, then go live.
For true unattended uptime also: System Settings > Users & Groups > automatic login,
and run this script once with --power.
MSG
