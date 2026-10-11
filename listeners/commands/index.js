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
  app.command('/jarvis-help', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-help');
    await handleHelp(args);
  });
  app.command('/jarvis-ping', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-ping');
    await handlePing(args);
  });
  app.command('/jarvis-catfact', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-catfact');
    await handleCatFact(args);
  });
  app.command('/jarvis-joke', async (args) => {
    args.logger.info('[jarvis-delivery] received /jarvis-joke');
    await handleJoke(args);
  });
}
