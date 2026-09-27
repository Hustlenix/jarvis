import axios from 'axios';

const CATFACT_URL = 'https://catfact.ninja/fact';
const FAILURE_TEXT =
  "😿 I couldn't fetch a cat fact just now (the cat fact service is unreachable). Try again in a minute!";
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * @param {string} fact
 */
export function formatCatFact(fact) {
  return `🐱 Cat Fact:\n${fact}`;
}

/**
 * Third-party payloads go unvalidated: treat anything that is not a non-empty
 * string as a failure rather than posting "undefined" to Slack.
 *
 * @param {unknown} data
 * @returns {string | null}
 */
export function extractFact(data) {
  const fact = /** @type {{ fact?: unknown } | null | undefined} */ (data)?.fact;
  return typeof fact === 'string' && fact.trim().length > 0 ? fact.trim() : null;
}

/**
 * @typedef {{ ack: () => Promise<void>, respond: (payload: { text: string }) => Promise<unknown> }} CommandArgs
 */

/**
 * @param {CommandArgs} args
 * @param {Pick<typeof axios, 'get'>} [client] axios-like client, injectable for tests
 * @returns {Promise<void>}
 */
export async function handleCatFact({ ack, respond }, client = axios) {
  await ack();

  try {
    const response = await client.get(CATFACT_URL, { timeout: REQUEST_TIMEOUT_MS });
    const fact = extractFact(response?.data);
    if (!fact) {
      await respond({ text: FAILURE_TEXT });
      return;
    }
    await respond({ text: formatCatFact(fact) });
  } catch (_err) {
    await respond({ text: FAILURE_TEXT });
  }
}
