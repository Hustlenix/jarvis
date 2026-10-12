# Jarvis
I have finished my Slack Bot mission which is named Jarvis, and it can now be acessed AS A [SLACK APP](https://slack.com/app_redirect?app=A0BNWE36ME2&team=T0266FRGM)
It is live 24/7 for free! 


## What it can do

Jarvis currently has these commands:

- `/jarvis-help` — shows the commands
- `/jarvis-catfact` — gives you a random cat fact
- `/jarvis-joke` — gives you a random joke

You can also mention Jarvis in Slack or DM it and ask it something. Basically it is an slack app, thats it

The AI part uses the Hack Club AI API; Thnaks to them that they are givig it for free. W HACKCLUB!

## Why I made this

I made Jarvis mainly because I wanted to understand how a real Slack bot works+make a llm(more like using it, not making it)
Before this i was using API keys mainly for my projects, like for my websites, ai agents and stuff in N8N, but making a Slack bot was kinda diffrent, cause getting all of those parts to work together was probably the main part of this project for me.

## How it works
The bot is basically built with node.js, a slack bolt for js, your own slack bot's app variable and bot variable, and finally a Hack club api key which you can get it for free from: https://ai.hackclub.com/keys

The is just an app/agent, just like our 'Starpheus' client which we acesss in our agents and apps section.

## Running it locally

Ig and hope node.js is installed 

Clone the repository using in your git bash, not cmd nor powershell:

```bash
git clone https://github.com/Hustlenix/jarvis
cd jarvis
npm install
```

Create an `.env` file, this is just an example env, change those to your API/variables.

```env
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
HACKCLUB_AI_API_KEY=your_hackclub_ai_key
```

Then run:

```bash
npm start
```

If everything is configured properly, Jarvis should connect to Slack!

## Keeping it online 24/7

When i first started making a slack bot, i thought it would be good if i use my own local AI model(qwen 3.1 or smtg), the problem was that it was hanging my whole laptop and also if i close my laptop the ai model also stops running, so i am using hackclub's free AI API


## Problems I ran into

The Slack setup was more confusing than I expected, like that nest, bolt, and config and stuff, was tuff

## What I learned

The biggest thing I learned from this project is that building the actual command is only one part of making a Slack bot🤣😭, most of it was just config.; I learned how systemd services can restart a bot, although the Nest deployment still needs a live test.

## Testing Jarvis

I test Jarvis in this [slack app](https://slack.com/app_redirect?app=A0BNWE36ME2&team=T0266FRGM)

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
## AI usage

I used AI while working on this project, and I want to be clear about where I used it.

I used AI coding assistants to help me write and modify few parts of my code, debug errors, understand Slack Bolt and Socket Mode, improve error handling, work on the AI API integration, and help with the Nest/systemd deployment configuration.

AI also helped me review the project, like crash testing it to the core!

An earlier version of my README was so heavily AI-assisted, that they regected it. The Shipwright reviewing my first submission pointed this out and asked me to rewrite it in my own words, so I replaced it.

What is ironic is that, Jarvis itself also intentionally uses AI as one of its features. Messages sent to its AI chat feature are passed to the Hack Club AI API and the response is returned inside Slack.

I personally configured the Slack app, tested the commands in Slack, worked through deployment problems, connected the required tokens/API keys, tested the bot, and decided how I wanted the project to work, with no ai assistance, fr, ng

## License

MIT
