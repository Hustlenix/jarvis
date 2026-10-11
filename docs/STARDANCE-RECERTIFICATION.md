# Stardance reviewer fix — Slack invalid_service

Stardance project: https://stardance.hackclub.com/projects/42170

The reviewer saw Slackbot say `invalid_service` for Jarvis commands. This is a Slack command-routing/installation error that can happen **before** our Bolt command functions run. Passing Node unit tests alone cannot establish a live fix.

## 1. Repair the EXISTING Slack app (do not create a competing Jarvis app)

1. Open https://api.slack.com/apps, select the **Jarvis app already installed in the Hack Club workspace**.
2. In **App Manifest**, compare the live manifest with this repository's `manifest.json`. Apply any missing settings and save:
   - `settings.socket_mode_enabled: true`
   - all four `features.slash_commands` entries: `/jarvis-help`, `/jarvis-ping`, `/jarvis-catfact`, `/jarvis-joke`
   - bot OAuth scope `commands`
   - the message event subscriptions used by Jarvis
3. Under **Socket Mode**, confirm it is enabled. Under **Basic Information → App-Level Tokens**, confirm an `xapp-` token with `connections:write` exists.
4. Under **OAuth & Permissions**, choose **Reinstall to Workspace** and select the **Hack Club workspace**, completing any required approval. A GitHub `manifest.json` file does NOT automatically update Slack.
5. Check **Slash Commands** in your Slack app settings: each command should be associated with this same Jarvis app. For Socket Mode, do not point commands to an arbitrary HTTP Request URL.
6. Verify the bot's `xoxb-` token is from the same app and the same workspace, and that the server's `xapp-` token belongs to this app. **Never paste tokens into GitHub, Slack messages, or screenshots.**
7. If `invalid_service` persists after a proper reinstall, inspect the Slack app's installation/command entries and ask a workspace app manager to help. As a last resort, reinstall/rotate stale credentials, then update the private server environment and restart Jarvis; do not revoke working tokens unnecessarily.

Slack's official Socket Mode docs: https://docs.slack.dev/apis/events-api/using-socket-mode/

## 2. Verify Nest deployment is actually running the current code

In the Nest SSH terminal, inside the Jarvis directory:

```bash
cd /root/jarvis
git pull --ff-only origin master
npm ci --omit=dev
npm run doctor
sudo systemctl restart slackbot.service
sudo systemctl is-active slackbot.service
sudo journalctl -u slackbot.service -n 60 --no-pager
```

Use a different folder/unit name only if that is how you installed it. `npm run doctor` reports whether the bot token and app token work separately; it does **not** prove that slash-command registrations reached Slack or the service is online. Confirm the workspace name printed by the doctor is **Hack Club**.

Check GitHub Actions → `Deploy to Nest`: a green workflow may still skip its deploy step when `NEST_HOST` is missing. Read the actual logs to confirm deployment occurred.

## 3. End-to-end tests (must pass before resubmitting)

In Hack Club's `#bot-spam` channel:

- `/jarvis-ping` → pong, latency, uptime
- `/jarvis-help` → command list
- `/jarvis-catfact` → a cat fact or a clearly explained API-unavailable response
- `/jarvis-joke` → joke or an explained API-unavailable response
- `@Jarvis ping` → pong without invoking a slash command

In a DM to Jarvis:

- `jarvis ping` → pong, without slash-command delivery or an AI key
- `jarvis help` → help
- An ordinary question → AI answer if `HACKCLUB_AI_API_KEY` is configured

If mention and DM text commands work but slash commands still show `invalid_service`, **the Slack-side slash registration still needs repair**. If neither responds, inspect Socket Mode tokens, event subscriptions, running process and the app's membership.

## 4. Re-certification proof

Record a short video showing the four slash commands succeeding in Slack and at least one DM/mention working. Show Jarvis's name and responses, not credentials. Add a new devlog explaining the actual cause and repair, then request re-certification. Don't request re-certification based only on green CI.

Older Slack SDK issue with the same error: https://github.com/slackapi/node-slack-sdk/issues/1001
