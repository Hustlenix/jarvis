/** Uptime and latency, measured against a real Slack API round-trip. */
const START_TIME = Date.now();

/**
 * @typedef {{ ack: () => Promise<void>, respond: (payload: { text: string }) => Promise<unknown>, client?: { auth: { test: () => Promise<unknown> } } }} CommandArgs
 */

/**
 * @param {number} latency round-trip time in milliseconds
 * @param {number} uptimeMs
 * @returns {string}
 */
export function buildPongText(latency, uptimeMs) {
  return `🏓 Pong!\nLatency: ${latency}ms\nUptime: ${formatUptime(uptimeMs)}\nJarvis is online.`;
}

/**
 * @param {number} uptimeMs
 * @returns {string}
 */
export function formatUptime(uptimeMs) {
  const totalSeconds = Math.max(0, Math.floor(uptimeMs / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Measure genuine round-trip latency. `auth.test` is the cheapest call that
 * still proves both the socket connection and the API are alive — timing only
 * `ack()` locally would always report ~0ms, which is not a health signal.
 *
 * @param {{ auth: { test: () => Promise<unknown> } }} client
 * @returns {Promise<number>} milliseconds, or -1 if Slack could not be reached
 */
async function measureSlackLatency(client) {
  const start = Date.now();
  try {
    await client.auth.test();
    return Date.now() - start;
  } catch {
    return -1;
  }
}

/**
 * @param {CommandArgs} args
 * @returns {Promise<void>}
 */
export async function handlePing({ ack, respond, client }) {
  const handlerStart = Date.now();
  await ack();

  // Without a client (e.g. in tests) we cannot measure a real round-trip, so
  // report how long the handler itself took rather than faking an API number.
  const latency = client?.auth?.test ? await measureSlackLatency(client) : Date.now() - handlerStart;

  if (latency < 0) {
    await respond({
      text: `🏓 Pong!\nLatency: unreachable\nUptime: ${formatUptime(Date.now() - START_TIME)}\nJarvis is online, but the Slack API did not answer.`,
    });
    return;
  }

  await respond({ text: buildPongText(latency, Date.now() - START_TIME) });
}
