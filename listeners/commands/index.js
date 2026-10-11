import { handleCatFact } from './catfact.js';
import { handleHelp } from './help.js';
import { handleJoke } from './joke.js';
import { handlePing } from './ping.js';

/**
 * Register slash command listeners with safe receipt diagnostics.
 * Do not log command text, users, tokens, or private response payloads.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.command('/jarvis-help-hustlenix', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-help-hustlenix');
    await handleHelp(args);
  });
  app.command('/jarvis-ping-hustlenix', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-ping-hustlenix');
    await handlePing(args);
  });
  app.command('/jarvis-catfact-hustlenix', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-catfact-hustlenix');
    await handleCatFact(args);
  });
  app.command('/jarvis-joke-hustlenix', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-joke-hustlenix');
    await handleJoke(args);
  });
}
