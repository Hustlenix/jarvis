import assert from 'node:assert';
import { describe, it } from 'node:test';

import { performWebSearch } from '../../../agent/tools/web-search.js';

describe('performWebSearch', () => {
  it('formats DuckDuckGo results', async () => {
    const client = {
      get: async () => ({
        data: {
          AbstractText: "The Moon is Earth's only natural satellite.",
          AbstractURL: 'https://en.wikipedia.org/wiki/Moon',
          RelatedTopics: [{ Text: 'The Moon orbits Earth every 27 days.' }],
        },
      }),
    };
    const result = await performWebSearch('the moon', client);
    assert.ok(result.includes('The Moon is Earth'));
    assert.ok(result.includes('Source: https://en.wikipedia.org/wiki/Moon'));
  });

  it('falls back to Wikipedia when DuckDuckGo is empty', async () => {
    const client = {
      get: async (url) => {
        if (url.includes('duckduckgo.com')) return { data: { AbstractText: '', RelatedTopics: [] } };
        return {
          data: {
            query: {
              search: [{ title: 'Jupiter', snippet: 'Jupiter is the <b>largest planet</b> in the Solar System.' }],
            },
          },
        };
      },
    };
    const result = await performWebSearch('jupiter', client);
    assert.ok(result.includes('Jupiter'));
    assert.ok(result.includes('largest planet'));
  });

  it('reports no results', async () => {
    const client = {
      get: async (url) => {
        if (url.includes('duckduckgo.com')) return { data: { AbstractText: '', RelatedTopics: [] } };
        return { data: { query: { search: [] } } };
      },
    };
    const result = await performWebSearch('zzzqqqnnn', client);
    assert.ok(result.includes('No results found'));
  });

  it('handles API errors gracefully', async () => {
    const client = {
      get: async () => {
        throw new Error('timeout');
      },
    };
    const result = await performWebSearch('anything', client);
    assert.ok(result.includes('Search failed'));
  });
});
