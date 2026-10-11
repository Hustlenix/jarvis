# Deploy Jarvis to Hack Club Nest

Jarvis uses Slack **Socket Mode**, so it needs a long-running Node process.
Passing GitHub CI tests does not mean the bot is hosted or live.

## 1. Get an approved Nest account

Nest's current official quickstart: https://guides.hackclub.app/index.php/Quickstart

The Nest dashboard shows the approved `jarvis` container is running.
From **Windows PowerShell**, connect as:

```powershell
ssh jarvis@hackclub.app
```

If SSH responds `Permission denied (publickey)`, your computer's SSH public key
is not authorized for this container; add the **public** `.pub` key through Nest's
approved key-management flow. Never share the private key. The SSH username
does not determine whether the container shell itself has root permissions.
Check with `id -u` after login.

## 2. Check prerequisites and clone

Inside the approved Nest container:

```bash
command -v node
node --version
command -v git
git clone https://github.com/Hustlenix/jarvis "$HOME/jarvis"
cd "$HOME/jarvis"
npm ci --omit=dev
```

Node 22 is the CI-tested version. If `node` or `git` is unavailable, install
them using the Nest environment's permitted installation method; do not run
`sudo apt` unless your Nest account actually permits it.

## 3. Configure private credentials

Create `$HOME/jarvis/.env` using a terminal editor:

```bash
cd "$HOME/jarvis"
nano .env
chmod 600 .env
```

File format (the following are examples, **not** real credentials):

```dotenv
SLACK_BOT_TOKEN=xoxb-REPLACE_WITH_CURRENT_BOT_TOKEN
SLACK_APP_TOKEN=xapp-REPLACE_WITH_CURRENT_APP_TOKEN
HACKCLUB_AI_API_KEY=REPLACE_WITH_CURRENT_HACK_CLUB_AI_KEY
```

No inline comments after the key values. The `xoxb-` bot token and `xapp-`
app-level token must belong to the same Jarvis Slack app installed in the
Hack Club workspace. The app-level token needs `connections:write`. The Hack
Club AI key only enables conversational AI; it cannot fix a broken Slack slash
command registration. Never commit `.env`, paste it into Slack, or add keys to
screenshots; rotate any previously exposed keys.

## 3A. Optional: one-command systemd setup

Once Node.js 22+, Git, the repository, and your private `.env` are in place,
run the included bootstrap script instead of manually assembling a unit:

```bash
cd "$HOME/jarvis"
bash deploy/bootstrap-nest.sh
```

It checks the two Slack credentials, optionally tests your Hack Club AI key,
installs a systemd service matching your actual account privilege level, and
starts it. If prerequisites are missing, it stops and prints the next action.
The script cannot create or acquire Slack credentials and does not repair
Slack's installed slash-command routing. Do not publish the contents of `.env`.

## 4. Run the real preflight and Slack test

```bash
npm run doctor
npm run doctor:ai
node index.js
```

`npm run doctor:ai` is only required for the AI feature and needs a current
valid Hack Club AI key. `npm run doctor` checks the Slack tokens but does not
prove that slash commands are registered or that the bot is live.

While `node index.js` is running, test `/jarvis-ping`, `/jarvis-help`,
`/jarvis-catfact`, `/jarvis-joke` and `@Jarvis ping` in Hack Club
`#bot-spam`. Also DM `jarvis ping`. If mentions/DMs work but slash commands
say `invalid_service`, apply `manifest.json` to the **existing** Jarvis app
at https://api.slack.com/apps, ensure Socket Mode and permissions are correct,
and reinstall it into Hack Club. Review
[STARDANCE-RECERTIFICATION.md](STARDANCE-RECERTIFICATION.md).

Stop the foreground process with Ctrl+C once it works.

## 5. Keep it running (select the service mode your container supports)

### Non-root account with a systemd user manager

This is the preferred setup for a regular Nest username:

```bash
cd "$HOME/jarvis"
mkdir -p "$HOME/.config/systemd/user"
cp deploy/nest-user.service "$HOME/.config/systemd/user/slackbot.service"
command -v node                 # if not /usr/bin/node, edit ExecStart in copied unit
systemctl --user daemon-reload
systemctl --user enable --now slackbot.service
systemctl --user status slackbot.service --no-pager
journalctl --user -u slackbot.service -n 50 --no-pager
```

The template assumes code at `$HOME/jarvis` and Node at `/usr/bin/node`.
If `systemctl --user` is unavailable or the process stops on logout, consult
Nest support about the permitted 24/7 service/linger mechanism rather than
claiming it is live.

### Container account with actual root/system-service permission

Only if you **are root within your assigned container** and system services
are allowed, you can adapt `deploy/slackbot.service`. Its default paths are
`/root/jarvis` and `/usr/bin/node`. Verify both before installing it in
`/etc/systemd/system/`. Do not run root-system-service instructions as an
unprivileged Nest user.

## 6. Optional automatic deployment from GitHub

The repo has `.github/workflows/deploy-nest.yml`. We have already set the
public connection details to `jarvis@hackclub.app` and made the install path
`$HOME/jarvis`, so **the only required GitHub Actions secret is
`NEST_SSH_KEY`**. If you want automatic deployments, create a **dedicated
deployment SSH key** on your own computer or approved Nest account, authorize
only its public key in the container, and add its private key to the GitHub
repository's **Actions secrets** (never as a tracked file). Do not send it in
chat. Avoid giving a personal SSH key with unrelated access to GitHub Actions.

The service must already be installed manually as in Step 5. Once set up,
the workflow restarts `systemctl --user` for a non-root account or the
system service for root. The job fails explicitly when the key is not
configured; an isolated passing CI job is not proof of deployment.

Only request Stardance re-certification after another person can successfully
use the bot in Hack Club Slack while your laptop is disconnected.
