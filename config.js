/**
 * Startup configuration checks.
 *
 * Kept separate from `index.js` so the rules can be unit-tested without booting
 * the bot (booting requires real Slack credentials).
 */

/**
 * Slack tokens are mandatory. The AI key is optional: without it the bot still
 * runs and the slash commands still work, it just cannot answer in chat.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ ok: boolean, missing: string[], fatalMessage: string | null, warnings: string[] }}
 */
export function checkEnvironment(env = process.env) {
  const missing = ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN'].filter((name) => !env[name]?.trim());

  const warnings = [];
  const aiKey = env.HACKCLUB_AI_API_KEY;
  if (typeof aiKey !== 'string' || aiKey.trim().length === 0) {
    warnings.push('HACKCLUB_AI_API_KEY is not set. AI chat is disabled; slash commands still work.');
  }

  let fatalMessage = null;
  if (missing.length > 0) {
    fatalMessage =
      `missing required environment ${missing.length > 1 ? 'variables' : 'variable'}: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill them in.';
  }

  return { ok: missing.length === 0, missing, fatalMessage, warnings };
}
