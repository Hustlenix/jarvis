import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getHackerNewsTop } from '../../../agent/tools/news.js';

describe('getHackerNewsTop', () => {
  it('formats the top stories', async () => {
    const client = {
      get: async () => ({
        data: {
          hits: [
            { title: 'New Rust release', points: 512, url: 'https://example.com/rust' },
            { title: 'Show HN: tiny web server', points: 89 },
          ],
        },
      }),
    };
    const result = await getHackerNewsTop(client);
    assert.ok(result.includes('New Rust release (512 pts)'));
    assert.ok(result.includes('https://example.com/rust'));
    assert.ok(result.includes('tiny web server'));
  });

  it('reports an empty feed', async () => {
    const client = { get: async () => ({ data: { hits: [] } }) };
    const result = await getHackerNewsTop(client);
    assert.ok(result.includes('No stories'));
  });

  it('handles API errors gracefully', async () => {
    const client = {
      get: async () => {
        throw new Error('down');
      },
    };
    const result = await getHackerNewsTop(client);
    assert.ok(result.includes('Could not fetch'));
  });
});
