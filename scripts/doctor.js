import 'dotenv/config';

import { checkEnvironment } from '../config.js';
import { verifySlackInstallation } from './slack-installation.js';

const validation = checkEnvironment();
if (!validation.ok) {
  console.error('[doctor] Missing required credentials. Configure .env on the machine hosting Jarvis.');
  process.exit(1);
}
const botToken = process.env.SLACK_BOT_TOKEN;
const appToken = process.env.SLACK_APP_TOKEN;
if (!botToken?.startsWith('xoxb-') || !appToken?.startsWith('xapp-')) {
  console.error('[doctor] Wrong token types: SLACK_BOT_TOKEN must start xoxb-, SLACK_APP_TOKEN must start xapp-.');
  process.exit(1);
}

/**
 * @param {string} endpoint
 * @param {string} token
 * @returns {Promise<Record<string, unknown>>}
 */
async function probe(endpoint, token, params = new URLSearchParams()) {
  const response = await fetch(`https://slack.com/api/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    const errorCode = typeof data.error === 'string' ? data.error.replace(/[^a-z_]/gi, '') : 'unknown';
    throw new Error(`${endpoint} failed (Slack error: ${errorCode})`);
  }
  return data;
}

try {
  const bot = await probe('auth.test', botToken);
  console.log('[doctor] Bot token: VALID');
  console.log(`[doctor] Workspace: ${String(bot.team || '(unknown)')} (${String(bot.team_id || '?')})`);
  console.log(`[doctor] Bot user: ${String(bot.user_id || '(unknown)')}`);
  if (bot.is_enterprise_install === true) {
    throw new Error('Org installation requires target workspace access; auth.test alone does not prove it.');
  }
  const info = await probe('bots.info', botToken, new URLSearchParams({ bot: String(bot.bot_id) }));
  const installation = verifySlackInstallation({
    appToken,
    bot,
    botInfo: /** @type {Record<string, unknown>} */ (info.bot),
  });
  console.log(`[doctor] Both credentials belong to app ${installation.appId} in workspace ${installation.teamId}.`);
  await probe('apps.connections.open', appToken);
  console.log('[doctor] App token / Socket Mode connection: VALID');
  console.log('[doctor] This cannot verify command installation or whether the Nest service is running.');
  console.log('[doctor] Next: test /jarvis-ping and Jarvis DM "jarvis ping" in the target workspace.');
} catch (err) {
  // Never print raw HTTP payloads or the secret Socket Mode WebSocket URL.
  console.error(`[doctor] FAILED: ${err instanceof Error ? err.message : 'network/API error'}`);
  process.exitCode = 1;
}
