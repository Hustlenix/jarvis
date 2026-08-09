# Jarvis

A friendly AI Slack bot for the [Hack Club](https://hackclub.com) workspace, built
with [Bolt for JavaScript](https://slack.dev/bolt-js/) and the
[OpenAI Agents SDK](https://openai.github.io/openai-agents-python/).

Jarvis lives in Slack: @-mention it or DM it and it'll chat with you (with a
little personality), remember what you talked about, and react to your messages
with emoji. It also has a few slash commands for quick stuff.

## Features

- **AI chat** — mention `@Jarvis` in a channel or send a DM. Replies stream into
  the thread with a "thinking…" status, and Jarvis remembers the last few
  messages so the conversation flows.
- **Agent tools** — Jarvis can search the web, fetch a URL you share, check the
  weather anywhere, list today's top Hacker News stories, and set reminders
  right from the conversation.
- **Slash commands**

  | Command | What it does |
  | --- | --- |
  | `/jarvis-help` | Lists all available commands |
  | `/jarvis-ping` | Checks bot latency |
  | `/jarvis-catfact` | Fetches a random cat fact |
  | `/jarvis-joke` | Fetches a random joke |

- **App Home** — the Home tab shows what Jarvis can do.
- **Feedback buttons** — rate Jarvis's replies right in the thread.

All commands are prefixed with `jarvis-` so they don't collide with the other
bots in the Hack Club workspace.

## Getting started

You'll need:

- Node.js 20+
- A Slack app with Socket Mode enabled (see below)
- A Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Set up the Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
   from the `manifest.json` in this repo.
2. Enable **Socket Mode** and generate an app-level token with the
   `connections:write` scope (starts with `xapp-`).
3. Install the app to your workspace and copy the Bot User OAuth Token
   (starts with `xoxb-`).

### 2. Configure the environment

```bash
cp .env.sample .env
```

Then fill in the three values in `.env`:

- `SLACK_BOT_TOKEN` — the `xoxb-` token from step 1
- `SLACK_APP_TOKEN` — the `xapp-` token from step 1
- `GEMINI_API_KEY` — your Google AI Studio key (for the AI chat — the slash commands work without it)

### 3. Run it

```bash
npm install
npm start
```

You should see `Jarvis is running!`. Invite `@Jarvis` to a channel and try a
mention or `/jarvis-ping`.

## Running 24/7

The bot runs on [Hack Club Nest](https://hackclub.com/nest) as a `systemd`
service so it stays online even when your laptop is closed. See
[`docs/NEST-DEPLOY.md`](docs/NEST-DEPLOY.md) for the full walkthrough.

## Development

```bash
npm run check   # type-check with tsc
npm test        # run the test suite (node --test)
npm run lint    # biome lint
```

## Project layout

```
index.js                  entry point — sets up the Bolt app
listeners/                Slack handlers, grouped by type
  events/                 app_mention, messages, app_home_opened
  commands/               slash command handlers
  actions/                button interactions
  views/                  Block Kit builders
agent/                    the OpenAI agent (prompt, tools, deps)
thread-context/           in-memory conversation history
deploy/                   systemd unit for Nest
.github/workflows/        CI + optional auto-deploy to Nest
```

## License

MIT — see [LICENSE](LICENSE).
