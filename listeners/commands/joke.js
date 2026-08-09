import axios from 'axios';

/**
 * @param {string} setup
 * @param {string} punchline
 */
export function formatJoke(setup, punchline) {
  return `${setup}\n\n${punchline}`;
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
    const response = await client.get('https://official-joke-api.appspot.com/random_joke');
    await respond({ text: formatJoke(response.data.setup, response.data.punchline) });
  } catch (_err) {
    await respond({ text: 'Failed to fetch a joke.' });
  }
}
