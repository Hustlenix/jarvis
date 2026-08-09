import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildPongText, handlePing } from '../../../listeners/commands/ping.js';

describe('buildPongText', () => {
  it('reports the latency', () => {
    const text = buildPongText(42);
    assert.ok(text.includes('Pong!'));
    assert.ok(text.includes('42ms'));
  });
});

describe('handlePing', () => {
  it('acks before responding', async () => {
    const order = [];
    await handlePing({
      ack: async () => {
        order.push('ack');
      },
      respond: async () => {
        order.push('respond');
      },
    });
    assert.deepStrictEqual(order, ['ack', 'respond']);
  });

  it('responds with a pong', async () => {
    const sent = [];
    await handlePing({
      ack: async () => {},
      respond: async (payload) => {
        sent.push(payload);
      },
    });
    assert.ok(sent[0].text.startsWith('Pong!'));
  });
});
