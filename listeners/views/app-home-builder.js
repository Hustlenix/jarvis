const COMMANDS = [
  '`/jarvis-help` — show all available commands',
  '`/jarvis-ping` — check bot latency',
  '`/jarvis-catfact` — get a random cat fact',
  '`/jarvis-joke` — get a random joke',
];

/**
 * Build the App Home Block Kit view.
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView() {
  /** @type {import('@slack/types').KnownBlock[]} */
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: "Hey there :wave: I'm Jarvis, your Slack assistant.",
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          "I'm a friendly AI bot for the Hack Club Slack. DM me or mention me in any channel " +
          "and I'll answer questions, remember our conversations, and help you out.\n\n" +
          '*Commands:*\n' +
          COMMANDS.join('\n'),
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '\ud83d\udfe2 *Jarvis is online and ready to help.*',
      },
    },
  ];

  return { type: 'home', blocks };
}
