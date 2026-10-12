import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildHelpText, handleHelp } from '../../../listeners/commands/help.js';
import { COMMAND_NAMES } from '../../../listeners/commands/names.js';

describe('buildHelpText', () => {
  it('lists every available command', () => {
    const text = buildHelpText();
    for (const command of Object.values(COMMAND_NAMES)) {
      assert.ok(text.includes(command), `missing ${command}`);
    }
    assert.doesNotMatch(text, /\/jarvis-(?:help|ping|catfact|joke)(?:\s|\b)/);
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
