import assert from 'node:assert';
import { describe, it } from 'node:test';

import { extractJoke, formatJoke, handleJoke } from '../../../listeners/commands/joke.js';

describe('formatJoke', () => {
  it('formats setup and punchline', () => {
    assert.strictEqual(
      formatJoke('Why did the scarecrow win?', 'Because he was outstanding.'),
      'Why did the scarecrow win?\n\nBecause he was outstanding.',
    );
  });
});

describe('extractJoke', () => {
  it('accepts a setup and punchline pair', () => {
    assert.deepStrictEqual(extractJoke({ setup: 'Setup', punchline: 'Punchline' }), {
      setup: 'Setup',
      punchline: 'Punchline',
    });
  });

  it('rejects a one-liner with no punchline', () => {
    assert.strictEqual(extractJoke({ setup: 'Only a setup' }), null);
  });

  it('rejects a blank punchline', () => {
    assert.strictEqual(extractJoke({ setup: 'Setup', punchline: '  ' }), null);
  });

  it('rejects a non-object body', () => {
    assert.strictEqual(extractJoke('a string'), null);
    assert.strictEqual(extractJoke(undefined), null);
  });
});

describe('handleJoke', () => {
  it('responds with the joke on success', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => ({ data: { setup: 'Setup', punchline: 'Punchline' } }),
    };
    await handleJoke(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(sent[0].text.includes('Setup'));
    assert.ok(sent[0].text.includes('Punchline'));
  });

  it('passes a timeout so a stalled upstream cannot hang the handler', async () => {
    let seenOptions;
    const fakeClient = {
      get: async (_url, options) => {
        seenOptions = options;
        return { data: { setup: 'Setup', punchline: 'Punchline' } };
      },
    };
    await handleJoke({ ack: async () => {}, respond: async () => {} }, fakeClient);
    assert.strictEqual(typeof seenOptions?.timeout, 'number');
    assert.ok(seenOptions.timeout > 0);
  });

  it('responds with a failure message when the API errors', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => {
        throw new Error('down');
      },
    };
    await handleJoke(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(sent[0].text.includes("couldn't fetch a joke"));
  });

  it('responds with a failure message on a malformed payload', async () => {
    const sent = [];
    const fakeClient = {
      get: async () => ({ data: { type: 'single', joke: 'A one-liner with no punchline' } }),
    };
    await handleJoke(
      {
        ack: async () => {},
        respond: async (payload) => {
          sent.push(payload);
        },
      },
      fakeClient,
    );
    assert.ok(sent[0].text.includes("couldn't fetch a joke"));
  });
});
