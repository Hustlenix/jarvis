import { COMMAND_HELP_LINES } from './names.js';

const CHAT_HINT = 'You can also just say hi: mention `@Jarvis` in a channel, or DM me directly.';

/**
 * @returns {string}
 */
export function buildHelpText() {
  return `👋 Hi, I'm Jarvis.\n\n*Commands*\n${COMMAND_HELP_LINES.join('\n')}\n\n${CHAT_HINT}`;
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
