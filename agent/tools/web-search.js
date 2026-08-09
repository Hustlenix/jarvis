import { tool } from '@openai/agents';
import { z } from 'zod';

/**
 * Search the web using DuckDuckGo's Instant Answer API, falling back to
 * Wikipedia search when DuckDuckGo has nothing useful.
 * @param {string} query
 * @param {Pick<typeof import('axios').default, 'get'>} client axios-like client, injectable for tests
 * @returns {Promise<string>}
 */
export async function performWebSearch(query, client) {
  try {
    const encoded = encodeURIComponent(query);
    const duck = await client.get(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`);
    const { AbstractText, AbstractURL, Answer, RelatedTopics } = duck.data || {};
    const topics = Array.isArray(RelatedTopics)
      ? RelatedTopics.filter((t) => t?.Text)
          .slice(0, 3)
          .map((t) => `- ${t.Text}`)
          .join('\n')
      : '';

    if (AbstractText || Answer) {
      const parts = [];
      if (Answer) parts.push(Answer);
      if (AbstractText) parts.push(AbstractText);
      if (topics) parts.push(topics);
      if (AbstractURL) parts.push(`Source: ${AbstractURL}`);
      return parts.join('\n\n');
    }
    if (topics) {
      return topics;
    }

    const wiki = await client.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&formatversion=2&srlimit=3`,
    );
    const results = wiki.data?.query?.search || [];
    if (results.length === 0) {
      return `No results found for "${query}".`;
    }
    return results
      .map(
        (/** @type {any} */ r, /** @type {number} */ i) =>
          `${i + 1}. ${r.title}\n   ${r.snippet.replace(/<[^>]*>/g, '')}`,
      )
      .join('\n\n');
  } catch (_err) {
    return 'Search failed — the search service is unreachable right now.';
  }
}

/** Web search tool for Jarvis. */
export const webSearch = tool({
  name: 'web_search',
  description:
    'Search the web for current information: news, facts, people, definitions, prices, events. ' +
    'Use this when you need facts you are not sure about, or anything time-sensitive.',
  parameters: z.object({
    query: z.string().describe('The search query, phrased like a search engine query.'),
  }),
  execute: async ({ query }) => performWebSearch(query, (await import('axios')).default),
});
