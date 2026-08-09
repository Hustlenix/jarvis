import assert from 'node:assert';
import { describe, it } from 'node:test';

import { fetchPageText } from '../../../agent/tools/fetch-url.js';

describe('fetchPageText', () => {
  it('rejects invalid URLs', async () => {
    const result = await fetchPageText('not a url', { get: async () => ({ data: '' }) });
    assert.ok(result.includes('valid URL'));
  });

  it('rejects non-http protocols', async () => {
    const result = await fetchPageText('ftp://example.com/file', { get: async () => ({ data: '' }) });
    assert.ok(result.includes('http'));
  });

  it('strips HTML tags and collapses whitespace', async () => {
    const client = {
      get: async () => ({
        data: '<html><script>var x = 1;</script><style>.a{}</style><body><h1>Hello</h1><p>World &amp; more</p></body></html>',
      }),
    };
    const result = await fetchPageText('https://example.com', client);
    assert.ok(result.includes('Hello'));
    assert.ok(result.includes('World & more'));
    assert.ok(!result.includes('<h1>'));
    assert.ok(!result.includes('var x'));
  });

  it('truncates long pages', async () => {
    const client = {
      get: async () => ({ data: `<p>${'a'.repeat(6000)}</p>` }),
    };
    const result = await fetchPageText('https://example.com', client);
    assert.ok(result.length < 4500);
    assert.ok(result.includes('[truncated]'));
  });

  it('handles fetch errors gracefully', async () => {
    const client = {
      get: async () => {
        throw new Error('ECONNREFUSED');
      },
    };
    const result = await fetchPageText('https://example.com', client);
    assert.ok(result.includes('Could not fetch'));
  });
});
