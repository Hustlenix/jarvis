import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildPongText, formatUptime, handlePing } from '../../../listeners/commands/ping.js';

describe('buildPongText', () => {
  it('reports the latency', () => {
    const text = buildPongText(42, 60_000);
    assert.ok(text.includes('Pong!'));
    assert.ok(text.includes('42ms'));
  });
});

describe('formatUptime', () => {
  it('reports minutes under an hour', () => {
    assert.strictEqual(formatUptime(5 * 60_000), '5m');
  });

  it('reports hours and minutes', () => {
    assert.strictEqual(formatUptime(3 * 3_600_000 + 20 * 60_000), '3h 20m');
  });

  it('reports days, hours and minutes', () => {
    assert.strictEqual(formatUptime(2 * 86_400_000 + 4 * 3_600_000 + 7 * 60_000), '2d 4h 7m');
  });

  it('never reports a negative uptime', () => {
    assert.strictEqual(formatUptime(-5_000), '0m');
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
    assert.ok(sent[0].text.startsWith('🏓 Pong!'));
  });

  it('measures a real round-trip against the Slack API', async () => {
    const sent = [];
    let testCalled = false;
    await handlePing({
      ack: async () => {},
      respond: async (payload) => {
        sent.push(payload);
      },
      client: {
        auth: {
          test: async () => {
            testCalled = true;
          },
        },
      },
    });
    assert.ok(testCalled, 'expected auth.test to be called for a real latency measurement');
    assert.match(sent[0].text, /Latency: \d+ms/);
    assert.ok(!sent[0].text.includes('unreachable'));
  });

  it('reports unreachable instead of a fake latency when Slack does not answer', async () => {
    const sent = [];
    await handlePing({
      ack: async () => {},
      respond: async (payload) => {
        sent.push(payload);
      },
      client: {
        auth: {
          test: async () => {
            throw new Error('slack down');
          },
        },
      },
    });
    assert.ok(sent[0].text.includes('Latency: unreachable'));
  });
});
