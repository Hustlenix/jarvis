import { tool } from '@openai/agents';
import { z } from 'zod';

/**
 * Get the top stories on Hacker News right now.
 * @param {Pick<typeof import('axios').default, 'get'>} client axios-like client, injectable for tests
 * @returns {Promise<string>}
 */
export async function getHackerNewsTop(client) {
  try {
    const response = await client.get('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5');
    const hits = response.data?.hits || [];
    if (hits.length === 0) {
      return 'No stories right now — the feed looks empty.';
    }
    return hits
      .map(
        (/** @type {any} */ h, /** @type {number} */ i) =>
          `${i + 1}. ${h.title}${h.points ? ` (${h.points} pts)` : ''}${h.url ? ` — ${h.url}` : ''}`,
      )
      .join('\n');
  } catch (_err) {
    return 'Could not fetch the news feed right now.';
  }
}

/** News tool for Jarvis. */
export const topNews = tool({
  name: 'get_top_news',
  description:
    'Get the current top stories on Hacker News (tech/startups/science news). ' +
    "Use this when the user asks what is happening in tech or wants today's top stories.",
  parameters: z.object({}),
  execute: async () => getHackerNewsTop((await import('axios')).default),
});
