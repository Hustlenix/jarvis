import { Agent, OpenAIChatCompletionsModel, run } from '@openai/agents';
import OpenAI from 'openai';
import {
  AiUnavailableError,
  getAiSettings,
  isAiConfigured,
  MAX_TURNS,
  REQUEST_TIMEOUT_MS,
  RUN_TIMEOUT_MS,
  withTimeout,
} from './ai.js';
import { addEmojiReaction, fetchUrl, setReminder, topNews, weather, webSearch } from './tools/index.js';

const SYSTEM_PROMPT = `\
You are Jarvis, a helpful assistant inside the Hack Club Slack workspace.
Be concise, friendly, technically accurate, and useful to teenagers building projects.
Do not pretend to have performed actions you did not perform.

## RESPONSE STYLE
- Keep replies to 3 sentences max — punchy and scannable
- Put the next step on its own line when there is one
- Bullet lists only for genuinely multi-step answers
- Use standard Slack markdown: **bold**, _italic_, \`code\`, \`\`\`code blocks\`\`\`
- At most one emoji, and only when it adds tone

## TOOLS
- \`web_search\`: current facts, news, anything time-sensitive or uncertain
- \`fetch_url\`: the user shares a link and wants to know what's on it
- \`get_weather\`: any weather question
- \`get_top_news\`: what is happening in tech
- \`set_reminder\`: the user wants to be reminded later
- \`add_emoji_reaction\`: react to the user's message with a topical emoji

If a tool fails or returns nothing, say so plainly instead of inventing an answer.`;

/** @type {OpenAI | null} */
let cachedClient = null;
/** @type {import('@openai/agents').Agent | null} */
let cachedAgent = null;

/**
 * Build (once) the OpenAI-compatible client pointed at Hack Club AI.
 * Lazy so that importing this module never throws on a missing key.
 *
 * @returns {OpenAI}
 */
function getClient() {
  if (cachedClient) return cachedClient;
  if (!isAiConfigured()) {
    throw new AiUnavailableError('HACKCLUB_AI_API_KEY is not set, so AI chat is disabled.');
  }
  const { baseURL } = getAiSettings();
  cachedClient = new OpenAI({
    apiKey: /** @type {string} */ (process.env.HACKCLUB_AI_API_KEY),
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 2,
  });
  return cachedClient;
}

/**
 * @returns {import('@openai/agents').Agent}
 */
function getAgent() {
  if (cachedAgent) return cachedAgent;
  const { model } = getAiSettings();
  cachedAgent = new Agent({
    name: 'Jarvis',
    instructions: SYSTEM_PROMPT,
    tools: [addEmojiReaction, webSearch, fetchUrl, weather, topNews, setReminder],
    model: new OpenAIChatCompletionsModel(getClient(), model),
  });
  return cachedAgent;
}

/**
 * Reset the memoised client/agent. Used by tests.
 * @returns {void}
 */
export function resetAiClient() {
  cachedClient = null;
  cachedAgent = null;
}

/**
 * Run the agent with the given input and dependencies.
 *
 * @param {string | import('@openai/agents').AgentInputItem[]} inputItems
 * @param {import('./deps.js').AgentDeps} deps
 * @returns {Promise<import('@openai/agents').RunResult<any, any>>}
 */
export async function runAgent(inputItems, deps) {
  const agent = getAgent();
  return await withTimeout(
    run(agent, inputItems, { context: deps, maxTurns: MAX_TURNS }),
    RUN_TIMEOUT_MS,
    'The AI took too long to answer. Try again in a moment.',
  );
}
