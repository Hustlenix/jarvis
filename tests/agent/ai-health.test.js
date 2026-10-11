import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { probeHackClubAi } from '../../agent/ai-health.js';

const base = {
  apiKey: 'TEST-SECRET-DO-NOT-PRINT',
  baseURL: 'https://ai.hackclub.com/proxy/v1/',
  model: 'openai/gpt-6-luna',
};

describe('Hack Club AI key verification', () => {
  it('sends an authenticated minimal chat request', async () => {
    let url;
    let init;
    const result = await probeHackClubAi({
      ...base,
      fetchImpl: async (input, options) => {
        url = input;
        init = options;
        return new Response(JSON.stringify({ choices: [{ message: { content: 'PONG' } }] }), { status: 200 });
      },
    });
    assert.equal(url, 'https://ai.hackclub.com/proxy/v1/chat/completions');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Bearer TEST-SECRET-DO-NOT-PRINT');
    assert.equal(JSON.parse(init.body).model, base.model);
    assert.equal(JSON.parse(init.body).reasoning_effort, 'none');
    assert.equal(JSON.parse(init.body).max_completion_tokens, 64);
    assert.equal(JSON.parse(init.body).max_tokens, undefined);
    assert.deepEqual(result, { model: base.model, reachable: true });
  });

  it('reports an invalid key without including credentials or server response body', async () => {
    await assert.rejects(
      probeHackClubAi({
        ...base,
        fetchImpl: async () => new Response('TEST-SECRET-DO-NOT-PRINT', { status: 401 }),
      }),
      (err) => {
        assert.match(err.message, /rejected the key/);
        assert.ok(!err.message.includes(base.apiKey));
        return true;
      },
    );
  });

  it('reports rate limiting without leaking credentials', async () => {
    await assert.rejects(
      probeHackClubAi({ ...base, fetchImpl: async () => new Response('quota', { status: 429 }) }),
      /rate limit/,
    );
  });

  it('handles an empty completion as invalid', async () => {
    await assert.rejects(
      probeHackClubAi({
        ...base,
        fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: '' } }] })),
      }),
      /returned no text/,
    );
  });

  it('does not make a request with a missing key', async () => {
    let called = false;
    await assert.rejects(
      probeHackClubAi({
        ...base,
        apiKey: '   ',
        fetchImpl: async () => {
          called = true;
          return new Response('{}');
        },
      }),
      /is missing/,
    );
    assert.equal(called, false);
  });

  it('sanitizes network failures', async () => {
    await assert.rejects(
      probeHackClubAi({
        ...base,
        fetchImpl: async () => {
          throw new Error('token was TEST-SECRET-DO-NOT-PRINT');
        },
      }),
      (err) => {
        assert.match(err.message, /unreachable or timed out/);
        assert.ok(!err.message.includes(base.apiKey));
        return true;
      },
    );
  });
});
