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

import { SYSTEM_PROMPT } from './system-prompt.js';

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
