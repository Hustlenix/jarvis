import { describeAiError } from '../../agent/index.js';

const LOADING_MESSAGES = ['Reticulating splines…', 'Asking the hamsters for a second opinion…', 'Almost there…'];

/**
 * Show the "thinking…" assistant status, but never let a status failure abort
 * the reply — assistant thread status depends on Slack-side configuration that
 * can be turned off independently of the bot.
 *
 * @param {((options: { status: string, loading_messages: string[] }) => Promise<unknown>)} [setStatus]
 * @param {import('@slack/bolt').Logger} [logger]
 * @returns {Promise<void>}
 */
export async function safeSetStatus(setStatus, logger) {
  if (typeof setStatus !== 'function') return;
  try {
    await setStatus({ status: 'Thinking…', loading_messages: LOADING_MESSAGES });
  } catch (err) {
    logger?.debug(`Could not set assistant status: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Turn a thrown error into a short, safe Slack reply. Never interpolate the raw
 * error text: SDK messages can embed request URLs and headers.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function buildAiErrorText(err) {
  return `:warning: I couldn't answer that — ${describeAiError(err)}. Try again in a moment!`;
}

/**
 * A model can legitimately return nothing; say so instead of posting a blank
 * message or crashing.
 *
 * @param {unknown} finalOutput
 * @returns {string | null} trimmed text, or null when empty
 */
export function extractReply(finalOutput) {
  return typeof finalOutput === 'string' && finalOutput.trim().length > 0 ? finalOutput.trim() : null;
}
