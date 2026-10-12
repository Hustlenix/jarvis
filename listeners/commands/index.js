import { handleCatFact } from './catfact.js';
import { handleHelp } from './help.js';
import { handleJoke } from './joke.js';
import { COMMAND_NAMES } from './names.js';
import { handlePing } from './ping.js';

/**
 * Register slash command listeners with safe receipt diagnostics.
 * Do not log command text, users, tokens, or private response payloads.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.command(COMMAND_NAMES.help, async (args) => {
    args.logger.info(`[jarvis-delivery] received ${COMMAND_NAMES.help}`);
    await handleHelp(args);
  });
  app.command(COMMAND_NAMES.ping, async (args) => {
    args.logger.info(`[jarvis-delivery] received ${COMMAND_NAMES.ping}`);
    await handlePing(args);
  });
  app.command(COMMAND_NAMES.catfact, async (args) => {
    args.logger.info(`[jarvis-delivery] received ${COMMAND_NAMES.catfact}`);
    await handleCatFact(args);
  });
  app.command(COMMAND_NAMES.joke, async (args) => {
    args.logger.info(`[jarvis-delivery] received ${COMMAND_NAMES.joke}`);
    await handleJoke(args);
  });
}
