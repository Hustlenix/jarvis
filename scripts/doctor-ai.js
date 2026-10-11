import 'dotenv/config';

import { getAiSettings, isAiConfigured } from '../agent/ai.js';
import { probeHackClubAi } from '../agent/ai-health.js';

if (!isAiConfigured()) {
  console.error('[ai-doctor] HACKCLUB_AI_API_KEY is missing from the server environment.');
  process.exit(1);
}

const { baseURL, model } = getAiSettings();

try {
  await probeHackClubAi({
    apiKey: /** @type {string} */ (process.env.HACKCLUB_AI_API_KEY),
    baseURL,
    model,
  });
  console.log(`[ai-doctor] Connected to Hack Club AI. Model "${model}" returned text.`);
  console.log('[ai-doctor] The API key was used without being printed or saved.');
  console.log('[ai-doctor] This does NOT confirm Slack slash-command delivery.');
} catch (err) {
  console.error(`[ai-doctor] FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
  process.exitCode = 1;
}
