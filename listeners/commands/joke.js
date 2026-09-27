import axios from 'axios';

const JOKE_URL = 'https://official-joke-api.appspot.com/random_joke';
const FAILURE_TEXT = "😄 I couldn't fetch a joke just now (the joke service is unreachable). Try again in a minute!";
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * @param {string} setup
 * @param {string} punchline
 */
export function formatJoke(setup, punchline) {
  return `${setup}\n\n${punchline}`;
}

/**
 * The joke API returns a few different shapes (jokes with no punchline, one-liners,
 * and outright malformed rows). Only accept a real setup + punchline pair.
 *
 * @param {unknown} data
 * @returns {{ setup: string, punchline: string } | null}
 */
export function extractJoke(data) {
  const row = /** @type {{ setup?: unknown, punchline?: unknown } | null | undefined} */ (data);
  const setup = typeof row?.setup === 'string' ? row.setup.trim() : '';
  const punchline = typeof row?.punchline === 'string' ? row.punchline.trim() : '';
  if (setup.length === 0 || punchline.length === 0) return null;
  return { setup, punchline };
}

/**
 * @typedef {{ ack: () => Promise<void>, respond: (payload: { text: string }) => Promise<unknown> }} CommandArgs
 */

/**
 * @param {CommandArgs} args
 * @param {Pick<typeof axios, 'get'>} [client] axios-like client, injectable for tests
 * @returns {Promise<void>}
 */
export async function handleJoke({ ack, respond }, client = axios) {
  await ack();

  try {
    const response = await client.get(JOKE_URL, { timeout: REQUEST_TIMEOUT_MS });
    const joke = extractJoke(response?.data);
    if (!joke) {
      await respond({ text: FAILURE_TEXT });
      return;
    }
    await respond({ text: formatJoke(joke.setup, joke.punchline) });
  } catch (_err) {
    await respond({ text: FAILURE_TEXT });
  }
}
