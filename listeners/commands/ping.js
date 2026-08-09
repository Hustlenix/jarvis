/**
 * @param {number} latency
 */
export function buildPongText(latency) {
  return `Pong!\nLatency: ${latency}ms`;
}

/**
 * @typedef {{ ack: () => Promise<void>, respond: (payload: { text: string }) => Promise<unknown> }} CommandArgs
 */

/**
 * @param {CommandArgs} args
 * @returns {Promise<void>}
 */
export async function handlePing({ ack, respond }) {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: buildPongText(latency) });
}
