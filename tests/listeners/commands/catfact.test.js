import assert from 'node:assert';
import { describe, it } from 'node:test';

import { formatCatFact, handleCatFact } from '../../../listeners/commands/catfact.js';

describe('formatCatFact', () => {
  it('formats the fact', () => {
    assert.strictEqual(formatCatFact('Cats sleep 70% of their lives.'), 'Cat Fact:\nCats sleep 70% of their lives.');
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
    assert.strictEqual(sent[0].text, 'Failed to fetch a cat fact.');
  });
});
