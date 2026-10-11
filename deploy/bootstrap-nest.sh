#!/usr/bin/env bash
# One-time setup after SSHing into your own Hack Club Nest container.
# Safe to re-run; never prints keys or writes secrets to git.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[nest] Node.js is not installed. Install Node.js 22 using your container's permitted package manager."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "[nest] npm is missing; install it before running this script."
  exit 1
fi
NODE_BIN="$(command -v node)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "[nest] Node.js 22 or newer is required for the tested environment. Found: $(node --version)"
  exit 1
fi

if [ ! -f .env ]; then
  echo "[nest] Missing private .env file. Create it with: nano \"$PROJECT_DIR/.env\""
  echo "[nest] Add SLACK_BOT_TOKEN=xoxb-..., SLACK_APP_TOKEN=xapp-..., and optionally HACKCLUB_AI_API_KEY=..."
  echo "[nest] Save the file, then rerun: bash deploy/bootstrap-nest.sh"
  exit 2
fi
chmod 600 .env
echo "[nest] Installing runtime dependencies..."
npm ci --omit=dev

echo "[nest] Checking Slack credentials without printing tokens..."
npm run doctor

if grep -qE '^HACKCLUB_AI_API_KEY=.+' .env; then
  echo "[nest] Checking Hack Club AI key..."
  npm run doctor:ai
else
  echo "[nest] AI key not configured; slash commands and text fallbacks can still run."
fi

if [ "$(id -u)" -eq 0 ]; then
  UNIT_FILE="/etc/systemd/system/slackbot.service"
  echo "[nest] Installing root-container systemd unit..."
  cat > "$UNIT_FILE" <<EOF
[Unit]
Description=Jarvis Slack bot
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
Environment=NODE_ENV=production
ExecStart=$NODE_BIN index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now slackbot.service
  systemctl restart slackbot.service
  sleep 2
  if ! systemctl is-active --quiet slackbot.service; then
    systemctl status slackbot.service --no-pager --lines=25 || true
    exit 1
  fi
  echo "[nest] Jarvis system service active."
  systemctl status slackbot.service --no-pager --lines=8
else
  UNIT_DIR="$HOME/.config/systemd/user"
  mkdir -p "$UNIT_DIR"
  echo "[nest] Installing unprivileged systemd user unit..."
  cat > "$UNIT_DIR/slackbot.service" <<EOF
[Unit]
Description=Jarvis Slack bot
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
Environment=NODE_ENV=production
ExecStart=$NODE_BIN index.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now slackbot.service
  systemctl --user restart slackbot.service
  sleep 2
  if ! systemctl --user is-active --quiet slackbot.service; then
    systemctl --user status slackbot.service --no-pager --lines=25 || true
    exit 1
  fi
  echo "[nest] Jarvis user service active."
  systemctl --user status slackbot.service --no-pager --lines=8
  echo "[nest] Check whether user services stay running after logout:"
  loginctl show-user "$(id -un)" -p Linger 2>/dev/null || true
  echo "[nest] If Linger=no, ask Nest support to enable user lingering or use the approved service method."
fi

echo "[nest] Process started. Live Slack slash commands still require the existing app to be installed correctly."
echo "[nest] Test /jarvis-ping and @Jarvis ping in Hack Club #bot-spam before requesting certification."
