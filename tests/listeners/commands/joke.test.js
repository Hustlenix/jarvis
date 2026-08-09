import assert from 'node:assert';
import { describe, it } from 'node:test';

import { formatJoke, handleJoke } from '../../../listeners/commands/joke.js';

describe('formatJoke', () => {
  it('formats setup and punchline', () => {
    assert.strictEqual(
      formatJoke('Why did the scarecrow win?', 'Because he was outstanding.'),
      'Why did the scarecrow win?\n\nBecause he was outstanding.',
    );
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
    assert.strictEqual(sent[0].text, 'Failed to fetch a joke.');
  });
});
