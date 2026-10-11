import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { handleTextCommand, parseTextCommand } from '../../../listeners/events/text-command.js';

describe('plain-text command fallback', () => {
  it('parses explicit Jarvis commands without trapping normal AI conversations', () => {
    assert.equal(parseTextCommand('jarvis ping'), 'ping');
    assert.equal(parseTextCommand('Jarvis: HELP'), 'help');
    assert.equal(parseTextCommand('jarvis-catfact'), 'catfact');
    assert.equal(parseTextCommand('jarvis joke!'), 'joke');
    assert.equal(parseTextCommand('tell me a joke'), null);
    assert.equal(parseTextCommand('ping'), null);
    assert.equal(parseTextCommand('ping', true), 'ping');
  });

  it('handles help via say without AI or slash-command delivery', async () => {
    const sent = [];
    const handled = await handleTextCommand('jarvis help', {
      threadTs: '123.456',
      say: async (payload) => sent.push(payload),
    });
    assert.equal(handled, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].thread_ts, '123.456');
    assert.match(sent[0].text, /\/jarvis-ping-hustlenix/);
  });

  it('handles ping with real client auth.test and retains thread', async () => {
    const sent = [];
    let checked = false;
    const handled = await handleTextCommand('ping', {
      allowBare: true,
      threadTs: '123.456',
      say: async (payload) => sent.push(payload),
      client: {
        auth: {
          test: async () => {
            checked = true;
          },
        },
      },
    });
    assert.equal(handled, true);
    assert.equal(checked, true);
    assert.match(sent[0].text, /Pong!/);
    assert.equal(sent[0].thread_ts, '123.456');
  });

  it('leaves unmatched messages to AI and sends no reply', async () => {
    let said = false;
    const handled = await handleTextCommand('How do I build a robot?', {
      threadTs: '123.456',
      say: async () => {
        said = true;
      },
    });
    assert.equal(handled, false);
    assert.equal(said, false);
  });
});
