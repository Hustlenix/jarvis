# README TODO

Left-over decisions that are yours to make, not mine. Nothing here is broken —
each item is a choice, a verification, or a nice-to-have.

## Needs your input

- **Reinstall the Slack app.** `manifest.json` dropped 19 unused *user* scopes
  (`search:read*`, `canvases:*`, `users:read.email`, `mpim:history`, …) plus the
  unused `users:read`, `im:write`, and `reactions:read`. I verified the code only
  calls `reactions.add` and never uses Slack's search, canvases, or user-lookup
  APIs, so they were dead weight. **Already-installed apps keep the old scopes**
  until you re-install from the updated manifest, so the trimmed list will not
  take effect on its own.
- **Confirm `groups:history` / `message.groups`.** Jarvis subscribes to private
  channel messages, but that only works in private channels it has been
  *invited* to. Decide whether private-channel replies are worth it; dropping
  both would shrink the permission surface further.
- **Confirm `assistant:write`.** Kept because the code uses Slack's assistant
  status API for the "thinking…" indicator. If you would rather drop the
  indicator and the permission, that is a small change in
  `listeners/events/shared.js`.
- **Decide about running as `root`.** The systemd unit uses `User=root` because
  the app lives in `/root/jarvis`, which is what Nest hands you by default. It is
  sandboxed (`NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=full`,
  `ProtectHome=read-only`) and Jarvis writes nothing, so it is contained — but a
  dedicated `jarvis` user under `/home/jarvis` is the tidier option if you want
   it.

## Verify on the server (I can't do these without Nest access)

- **Live AI chat in Slack.** Now verified against the real endpoint with a real
  key: `openai/gpt-4o-mini` answers through `https://ai.hackclub.com/proxy/v1`,
  and an `add_emoji_reaction` round trip (model → tool → Slack client → model)
  completes. That surfaced a proxy-strictness bug unit tests could not — see the
  `tests/agent/tools-schema.test.js` note. What is still unverified is the same
  thing end-to-end *through Slack*, which needs the service running on Nest:
  mention the bot in `#bot-spam` and confirm a reply streams back.
- **Confirm the model actually exists.** Done — `openai/gpt-4o-mini` is accepted
  by the proxy. If that ever stops being true, set `HACKCLUB_AI_MODEL` in `.env`;
  no code change needed.
- **Re-check the systemd unit loads** on the server after the
  `StartLimitIntervalSec` / `StartLimitBurst` move into `[Unit]`:
  `systemd-analyze verify /etc/systemd/system/slackbot.service`.
- **Configure the GitHub secrets** (`NEST_HOST`, `NEST_USER`, `NEST_PATH`,
  `NEST_SSH_KEY`). Until `NEST_HOST` is set the deploy job deliberately skips, so
  pushes verify but never touch the server.

## Optional polish

- **Pin `appleboy/ssh-action` to a commit SHA** instead of the `v1.2.0` tag. Tags
  are mutable, so pinning is the stronger supply-chain posture. I left the tag
  because I could not verify the SHA offline.
- **Persist conversation history.** History is in-memory and capped at 20
  messages, so a restart or a deploy wipes it and it does not survive multiple
  server replicas. A file- or Redis-backed store would fix both.
- **Add a real rate limiter** on AI replies. Right now the only throttle is the
  per-thread history cap.
- **Add a `.env` shape check to the docs.** The systemd `EnvironmentFile` parser
  does not understand `export FOO=bar` or trailing `# comments` on a value line;
  keep `.env` as plain `KEY=VALUE` with comments on their own lines.
- **Consider an `engines` field** in `package.json`. The README says Node 20+ and
  CI uses Node 22, but nothing enforces it.
