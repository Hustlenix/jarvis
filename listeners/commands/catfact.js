import axios from 'axios';

/**
 * @param {string} fact
 */
export function formatCatFact(fact) {
  return `Cat Fact:\n${fact}`;
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
    const response = await client.get('https://catfact.ninja/fact');
    await respond({ text: formatCatFact(response.data.fact) });
  } catch (_err) {
    await respond({ text: 'Failed to fetch a cat fact.' });
  }
}
