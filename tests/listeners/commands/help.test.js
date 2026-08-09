import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildHelpText, handleHelp } from '../../../listeners/commands/help.js';

describe('buildHelpText', () => {
  it('lists every available command', () => {
    const text = buildHelpText();
    for (const command of ['/jarvis-help', '/jarvis-ping', '/jarvis-catfact', '/jarvis-joke']) {
      assert.ok(text.includes(command), `missing ${command}`);
    }
  });
});

describe('handleHelp', () => {
  it('acks and responds with the help text', async () => {
    let acked = false;
    const sent = [];
    await handleHelp({
      ack: async () => {
        acked = true;
      },
      respond: async (payload) => {
        sent.push(payload);
      },
    });
    assert.ok(acked);
    assert.strictEqual(sent[0].text, buildHelpText());
  });
});
