import { handleCatFact } from '../commands/catfact.js';
import { handleHelp } from '../commands/help.js';
import { handleJoke } from '../commands/joke.js';
import { handlePing } from '../commands/ping.js';

/**
 * Plain-text alternatives to slash commands, for DMs or @mentions.
 * Slack's "invalid_service" happens before Bolt receives a slash command,
 * so an ordinary message provides a separate delivery path.
 *
 * @param {string} text
 * @param {boolean} [allowBare]
 * @returns {'help' | 'ping' | 'catfact' | 'joke' | null}
 */
export function parseTextCommand(text, allowBare = false) {
  const input = text.trim();
  const named = /^(?:jarvis[-\s,:]+|\/jarvis[-\s]+)(help|ping|catfact|joke)[.!?]?$/i.exec(input);
  if (named) return /** @type {'help' | 'ping' | 'catfact' | 'joke'} */ (named[1].toLowerCase());

  if (allowBare) {
    const bare = /^(help|ping|catfact|joke)[.!?]?$/i.exec(input);
    if (bare) return /** @type {'help' | 'ping' | 'catfact' | 'joke'} */ (bare[1].toLowerCase());
  }
  return null;
}

/**
 * @param {string} text
 * @param {{
 *   say: (payload: { text: string, thread_ts: string }) => Promise<unknown>,
 *   threadTs: string,
 *   client?: { auth: { test: () => Promise<unknown> } },
 *   allowBare?: boolean
 * }} options
 * @returns {Promise<boolean>} true when handled without the AI API
 */
export async function handleTextCommand(text, { say, threadTs, client, allowBare = false }) {
  const command = parseTextCommand(text, allowBare);
  if (!command) return false;

  const ack = async () => {};
  /** @param {{ text: string }} payload */
  const respond = async (payload) => {
    await say({ text: payload.text, thread_ts: threadTs });
  };

  switch (command) {
    case 'help':
      await handleHelp({ ack, respond });
      break;
    case 'ping':
      await handlePing({ ack, respond, client });
      break;
    case 'catfact':
      await handleCatFact({ ack, respond });
      break;
    case 'joke':
      await handleJoke({ ack, respond });
      break;
  }
  return true;
}
