/**
 * Hack Club AI integration.
 *
 * Single place that knows how to talk to https://ai.hackclub.com. Everything is
 * built lazily so that a missing API key (or an unreachable endpoint) can never
 * stop the slash commands from working.
 */

const DEFAULT_BASE_URL = 'https://ai.hackclub.com/proxy/v1';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

/** How long a single upstream request may take before we give up. */
export const REQUEST_TIMEOUT_MS = 45_000;
/** How long the whole agent run (across all tool turns) may take. */
export const RUN_TIMEOUT_MS = 90_000;
/** Cap on tool-call turns so a confused model cannot loop forever. */
export const MAX_TURNS = 8;

/**
 * Raised when the AI backend is unusable, so callers can reply with something
 * friendly instead of leaking a raw stack trace into Slack.
 */
export class AiUnavailableError extends Error {
  /**
   * @param {string} reason short, safe-to-show explanation
   */
  constructor(reason) {
    super(reason);
    this.name = 'AiUnavailableError';
  }
}

/**
 * @returns {boolean} true when an API key is present in the environment.
 */
export function isAiConfigured() {
  const key = process.env.HACKCLUB_AI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * @returns {{ baseURL: string, model: string }} resolved AI settings.
 */
export function getAiSettings() {
  return {
    baseURL: (process.env.HACKCLUB_AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.HACKCLUB_AI_MODEL || DEFAULT_MODEL,
  };
}

/**
 * Reject a promise that never settles. Without this, one stalled upstream
 * request would leave a Slack handler hanging forever.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} message
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, message) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new AiUnavailableError(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Pull a human-usable message out of whatever the OpenAI SDK threw, without
 * ever echoing credentials back to Slack.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function describeAiError(err) {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const lower = raw.toLowerCase();

  if (err instanceof AiUnavailableError) return err.message;
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('api key')) {
    return 'the AI API key is missing or invalid';
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
    return 'the AI provider is rate limiting us right now';
  }
  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return 'the AI provider did not respond in time';
  }
  if (lower.includes('503') || lower.includes('502') || lower.includes('500')) {
    return 'the AI provider returned a server error';
  }
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('enotfound')) {
    return 'the AI provider could not be reached';
  }
  // Unknown: report the class of failure, never the raw text (it can embed URLs
  // and request details).
  return 'the AI provider returned an unexpected error';
}
