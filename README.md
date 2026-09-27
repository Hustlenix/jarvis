# Jarvis

Jarvis is a Slack bot I made for the Hack Club workspace for the Stardance Slack Bot mission.

I wanted to make something that was more than just a bot that says "pong", so Jarvis has normal slash commands and can also reply using AI when you mention it or message it.

It runs using Slack Bolt with Node.js and uses Socket Mode, so I don't need to expose a webhook server just to receive Slack events.

## What it can do

Jarvis currently has these commands:

- `/jarvis-help` — shows the commands
- `/jarvis-ping` — checks if Jarvis is alive and responding
- `/jarvis-catfact` — gives you a random cat fact
- `/jarvis-joke` — gives you a random joke

You can also mention Jarvis in Slack or DM it and ask it something.

For example:

```text
@Jarvis explain recursion in simple words
```

The AI part uses the Hack Club AI API.

## Why I made this

I made Jarvis mainly because I wanted to understand how a real Slack bot works.

Before this, I had used APIs in websites, but Slack bots work differently because you have events, slash commands, permissions, Socket Mode, bot tokens and a bunch of configuration outside the actual code.

Getting all of those parts to work together was probably the main part of this project for me.

## How it works

The bot is built with:

- Node.js
- Slack Bolt for JavaScript
- Slack Socket Mode
- Hack Club AI API
- a few public APIs for things like jokes and cat facts

The main app starts the Slack Bolt client and then loads the different listeners for commands, messages and events.

I separated most of the handlers instead of putting everything inside one huge `index.js` file because it was easier to understand and debug that way.

## Running it locally

You need Node.js installed.

Clone the repository:

```bash
git clone https://github.com/Hustlenix/jarvis
cd jarvis
npm install
```

Create a `.env` file.

```env
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
HACKCLUB_AI_API_KEY=your_hackclub_ai_key
```

Then run:

```bash
npm start
```

If everything is configured properly, Jarvis should connect to Slack.

**Do not commit your `.env` file or API keys.**

## Keeping it online 24/7

One problem I had was that running the bot on my own computer meant Jarvis went offline whenever I closed the terminal or turned off my PC.

So I deployed it to Hack Club Nest and run it as a `systemd` service.

That means the bot can:

- keep running after I disconnect from SSH
- start again when the server reboots
- restart if the process crashes

The deployment setup is inside the `deploy/` folder and there is more information in `docs/NEST-DEPLOY.md`.

## Problems I ran into

The Slack setup was more confusing than I expected.

There are different tokens for the bot and Socket Mode, and the bot also needs the correct scopes before commands and messages work properly.

I also had to make sure Jarvis didn't reply to itself and create a bot loop.

Another issue was keeping the bot online all the time. Running `node index.js` on my laptop obviously wasn't actually 24/7, so I moved it to Nest and used systemd.

The AI part also needed error handling because I didn't want the whole Slack bot to crash just because the AI API failed.

## What I learned

The biggest thing I learned from this project is that building the actual command is only one part of making a Slack bot.

A lot of the work is configuration:

- scopes
- app manifests
- environment variables
- Socket Mode
- events
- deployment
- keeping secrets out of GitHub

I also understand systemd and always-on deployment better now because of this project.

## Testing Jarvis

I test Jarvis in Hack Club's `#bot-spam` channel.

Some easy commands to try are:

```text
/jarvis-help
/jarvis-ping
/jarvis-catfact
/jarvis-joke
```

You can also mention Jarvis and ask it something.

## Project structure

```text
index.js
listeners/
agent/
thread-context/
deploy/
docs/
manifest.json
```

`index.js` starts the bot.

`listeners/` contains most of the Slack event and command handlers.

`agent/` contains the AI-related code.

`thread-context/` handles the small amount of conversation context Jarvis remembers.

`deploy/` contains the files used to keep Jarvis running on the server.

## AI usage

I used AI while working on this project, and I want to be clear about where I used it.

I used AI coding assistants to help me write and modify parts of the code, debug errors, understand Slack Bolt and Socket Mode, improve error handling, work on the AI API integration, and help with the Nest/systemd deployment configuration.

AI also helped me review the project and find issues before resubmitting it to Stardance.

An earlier version of my README was also heavily AI-assisted. The Shipwright reviewing my first submission pointed this out and asked me to rewrite it in my own words, so I replaced it.

Jarvis itself also intentionally uses AI as one of its features. Messages sent to its AI chat feature are passed to the Hack Club AI API and the response is returned inside Slack.

I personally configured the Slack app, tested the commands in Slack, worked through deployment problems, connected the required tokens/API keys, tested the bot, and decided how I wanted the project to work.

## License

MIT
