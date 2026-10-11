import { handleAppHomeOpened } from './app-home-opened.js';
import { handleAppMentioned } from './app-mentioned.js';
import { handleMessage } from './message.js';

/**
 * Register event listeners with minimal, secret-free delivery diagnostics.
 * Do not log message text, users, tokens, or full Slack payloads.
 *
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.event('app_home_opened', handleAppHomeOpened);
  app.event('app_mention', async (args) => {
    args.logger.info('[jarvis-delivery] received app_mention');
    await handleAppMentioned(args);
  });
  app.event('message', async (args) => {
    if (args.event.channel_type === 'im') {
      args.logger.info('[jarvis-delivery] received DM message');
    }
    await handleMessage(args);
  });
}
