# Deploy Jarvis to Hack Club Nest (free 24/7 hosting)

Nest is Hack Club's free Debian server. The bot runs as a `systemd` service that
auto-restarts on crash and on reboot — 24/7, no laptop required.

## 1. SSH into Nest

```bash
ssh root@<your-nest-host>
```

You should land as `root` (prompt looks like `root@username:~#`).

## 2. Install prerequisites (first time only)

```bash
apt update
apt install -y git curl ca-certificates nano
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
```

## 3. Clone the repo

```bash
git clone https://github.com/Hustlenix/jarvis
cd jarvis
npm install
```

This clones into `/root/jarvis` — that path is used by the service file.

## 4. Create the .env on the server

Your `.env` is gitignored, so recreate it here:

```bash
nano .env
```

Paste in the same values you use locally:

```
SLACK_BOT_TOKEN=xoxb-...   # Bot User OAuth Token
SLACK_APP_TOKEN=xapp-...   # App-Level Token (connections:write)
OPENAI_API_KEY=sk-...      # OpenAI key (for the AI chat feature)
```

Save and exit: `Ctrl+O`, `Enter`, `Ctrl+X`.

Test it runs:

```bash
node index.js
```

You should see `Jarvis is running!`. Try `/jarvis-ping` in Slack (test in
`#bot-spam`, not `#stardance`). Then stop it with `Ctrl+C`.

## 5. Run as a systemd service

```bash
nano /etc/systemd/system/slackbot.service
```

Paste the contents of `deploy/slackbot.service` from this repo (edit
`WorkingDirectory` and `ExecStart` if your repo path or node path differ —
confirm with `which node`).

```bash
systemctl daemon-reload
systemctl enable --now slackbot.service
```

## 6. Verify

```bash
systemctl status slackbot.service
journalctl -u slackbot.service -f
```

`systemctl status` should show `active (running)`. Test `/jarvis-ping` again —
then close your laptop; the bot stays online.

## Lifecycle

```bash
systemctl restart slackbot.service   # restart
systemctl stop slackbot.service      # stop
journalctl -u slackbot.service -f    # logs
```

## Auto-deploy from GitHub Actions (optional)

The repo has `.github/workflows/deploy-nest.yml`. To deploy on every push:

1. Generate an SSH key pair: `ssh-keygen -t ed25519`
2. Add the public key to Nest: `~/.ssh/authorized_keys`
3. In GitHub → repo → Settings → Secrets and variables → Actions, add:
   - `NEST_HOST` — your Nest hostname
   - `NEST_USER` — `root`
   - `NEST_SSH_KEY` — the private key
   - `NEST_PATH` — `/root/jarvis`

Then every push to `main`/`master` pulls + restarts the bot on Nest.
