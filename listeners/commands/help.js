const COMMANDS = [
  '/jarvis-help - Show this list of commands',
  '/jarvis-ping - Check bot latency',
  '/jarvis-catfact - Get a random cat fact',
  '/jarvis-joke - Get a random joke',
  'Also try: @Jarvis <message> to chat with the AI, or DM me!',
];

export function buildHelpText() {
  return `Available Commands:\n${COMMANDS.join('\n')}`;
}

/**
 * @typedef {{ ack: () => Promise<void>, respond: (payload: { text: string }) => Promise<unknown> }} CommandArgs
 */

/**
 * @param {CommandArgs} args
 * @returns {Promise<void>}
 */
export async function handleHelp({ ack, respond }) {
  await ack();
  await respond({ text: buildHelpText() });
}
