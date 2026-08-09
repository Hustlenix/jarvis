import { tool } from '@openai/agents';
import { z } from 'zod';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const MAX_CHARS = 4000;

/**
 * Fetch a URL and return its readable text content (HTML stripped).
 * @param {string} url
 * @param {Pick<typeof import('axios').default, 'get'>} client axios-like client, injectable for tests
 * @returns {Promise<string>}
 */
export async function fetchPageText(url, client) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_err) {
    return 'That does not look like a valid URL.';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http and https URLs are supported.';
  }

  try {
    const response = await client.get(parsed.href, {
      timeout: 8000,
      headers: { 'User-Agent': USER_AGENT },
    });
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      return 'That page returned no readable text.';
    }
    return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n[truncated]` : text;
  } catch (_err) {
    return 'Could not fetch that URL — the site may be down, slow, or blocking requests.';
  }
}

/** URL fetch tool for Jarvis. */
export const fetchUrl = tool({
  name: 'fetch_url',
  description:
    'Fetch the contents of a URL and return it as plain text. Use this when the user shares a link ' +
    'and wants to know what is on it, or when you need details from a specific page.',
  parameters: z.object({
    url: z.string().url().describe('The full http(s) URL to fetch.'),
  }),
  execute: async ({ url }) => fetchPageText(url, (await import('axios')).default),
});
