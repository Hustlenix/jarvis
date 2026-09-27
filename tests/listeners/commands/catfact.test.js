import assert from 'node:assert';
import { describe, it } from 'node:test';

import { extractFact, formatCatFact, handleCatFact } from '../../../listeners/commands/catfact.js';

describe('formatCatFact', () => {
  it('formats the fact', () => {
    assert.strictEqual(formatCatFact('Cats sleep 70% of their lives.'), '🐱 Cat Fact:\nCats sleep 70% of their lives.');
  });
});

describe('extractFact', () => {
  it('accepts a non-empty fact string', () => {
    assert.strictEqual(extractFact({ fact: '  Cats purr at 25 Hz.  ' }), 'Cats purr at 25 Hz.');
  });

  it('rejects a missing fact', () => {
    assert.strictEqual(extractFact({}), null);
  });

  it('rejects a non-string fact', () => {
    assert.strictEqual(extractFact({ fact: 42 }), null);
  });

  it('rejects a blank fact', () => {
    assert.strictEqual(extractFact({ fact: '   ' }), null);
  });

  it('rejects a null body', () => {
    assert.strictEqual(extractFact(null), null);
  });
});

describe('handleCatFact', () => {
  it('responds with the fact on success', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => ({ data: { fact: 'A cat has 32 muscles per ear.' } }),
    };
    await handleCatFact(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(sent[0].text.includes('A cat has 32 muscles per ear.'));
  });

  it('passes a timeout so a stalled upstream cannot hang the handler', async () => {
    let seenOptions;
    const fakeClient = {
      get: async (_url, options) => {
        seenOptions = options;
        return { data: { fact: 'ok' } };
      },
    };
    await handleCatFact({ ack: async () => {}, respond: async () => {} }, fakeClient);
    assert.strictEqual(typeof seenOptions?.timeout, 'number');
    assert.ok(seenOptions.timeout > 0);
  });

  it('responds with a failure message when the API errors', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => {
        throw new Error('rate limited');
      },
    };
    await handleCatFact(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(sent[0].text.includes("couldn't fetch a cat fact"));
  });

  it('responds with a failure message instead of posting undefined', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => ({ data: {} }),
    };
    await handleCatFact(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(!sent[0].text.includes('undefined'));
    assert.ok(sent[0].text.includes("couldn't fetch a cat fact"));
  });
});
