/**
 * Check identity, not just whether two unrelated tokens authenticate.
 * @param {{ appToken: string, bot: Record<string, unknown>, botInfo: Record<string, unknown> }} args
 * @returns {{ appId: string, teamId: string }}
 */
export function verifySlackInstallation({ appToken, bot, botInfo }) {
  const socketAppId = appToken.split('-')[2];
  const appId = botInfo.app_id;
  if (typeof appId !== 'string' || appId !== socketAppId) {
    throw new Error('Slack tokens belong to different apps. Copy both tokens from the same Slack app.');
  }
  if (bot.is_enterprise_install === true) {
    throw new Error(
      'Org installation requires workspace access. Install Jarvis in the target workspace before testing.',
    );
  }
  const teamId = bot.team_id;
  if (typeof teamId !== 'string' || !teamId.startsWith('T')) {
    throw new Error('The bot token does not identify an installed workspace.');
  }
  return { appId, teamId };
}
