import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildAiErrorText, extractReply, safeSetStatus } from '../../../listeners/events/shared.js';

describe('safeSetStatus', () => {
  it('does nothing when setStatus is unavailable', async () => {
    await safeSetStatus(undefined, undefined);
  });

  it('swallows a status failure so the reply is not blocked', async () => {
    const logged = [];
    await safeSetStatus(
      async () => {
        throw new Error('assistant threads are not enabled');
      },
      { debug: (m) => logged.push(m) },
    );
    assert.strictEqual(logged.length, 1);
    assert.ok(logged[0].includes('assistant threads are not enabled'));
  });

  it('sets a status when the API allows it', async () => {
    const calls = [];
    await safeSetStatus(async (options) => calls.push(options), undefined);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].status, 'Thinking…');
    assert.ok(Array.isArray(calls[0].loading_messages) && calls[0].loading_messages.length > 0);
  });
});

describe('buildAiErrorText', () => {
  it('never echoes the raw error back to Slack', () => {
    const text = buildAiErrorText(new Error('request to https://ai.hackclub.com failed with key abc123'));
    assert.ok(!text.includes('abc123'));
    assert.ok(!text.includes('ai.hackclub.com'));
    assert.ok(text.startsWith(':warning:'));
  });
});

describe('extractReply', () => {
  it('returns trimmed text', () => {
    assert.strictEqual(extractReply('  hello  '), 'hello');
  });

  it('returns null for an empty string', () => {
    assert.strictEqual(extractReply('   '), null);
  });

  it('returns null for a non-string output', () => {
    assert.strictEqual(extractReply(undefined), null);
    assert.strictEqual(extractReply({ text: 'hi' }), null);
  });
});
