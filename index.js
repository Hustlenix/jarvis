import 'dotenv/config';

import { App, LogLevel } from '@slack/bolt';

import { checkEnvironment } from './config.js';
import { registerListeners } from './listeners/index.js';

// Validate BEFORE constructing App: Bolt's constructor throws an SDK error for a
// missing appToken, which would bury our actionable message under a stack trace.
const envCheck = checkEnvironment();
if (!envCheck.ok) {
  console.error(`[jarvis] FATAL: ${envCheck.fatalMessage}`);
  process.exit(1);
}
for (const warning of envCheck.warnings) {
  console.warn(`[jarvis] WARNING: ${warning}`);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  // Never process Jarvis's own messages: this is the outermost guard against
  // bot-to-bot reply loops (individual handlers check bot_id too).
  ignoreSelf: true,
  logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
});

registerListeners(app);

(async () => {
  try {
    await app.start();
    app.logger.info('Jarvis is running!');
  } catch (err) {
    app.logger.error(`Failed to start: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
})();

// A rejected promise in one handler must not take the whole bot offline.
process.on('unhandledRejection', (reason) => {
  app.logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

// An uncaught exception leaves the process in an unknown state, so log it and
// let systemd (Restart=always) start a clean process.
process.on('uncaughtException', (err) => {
  app.logger.error(`Uncaught exception, exiting for restart: ${err.message}`);
  process.exit(1);
});

// Clean shutdown so `systemctl restart` does not have to SIGKILL the process.
for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(signal, () => {
    app.logger.info(`Received ${signal}, shutting down.`);
    void app.stop().finally(() => process.exit(0));
    // Never hang a systemd stop forever.
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
