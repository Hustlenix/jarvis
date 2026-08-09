import { handleCatFact } from './catfact.js';
import { handleHelp } from './help.js';
import { handleJoke } from './joke.js';
import { handlePing } from './ping.js';

/**
 * Register slash command listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.command('/jarvis-help', handleHelp);
  app.command('/jarvis-ping', handlePing);
  app.command('/jarvis-catfact', handleCatFact);
  app.command('/jarvis-joke', handleJoke);
}
