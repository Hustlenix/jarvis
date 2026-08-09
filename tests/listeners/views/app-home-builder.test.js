import assert from 'node:assert';
import { describe, it } from 'node:test';

import { buildAppHomeView } from '../../../listeners/views/app-home-builder.js';

describe('buildAppHomeView', () => {
  it('returns a home view', () => {
    const view = buildAppHomeView();
    assert.strictEqual(view.type, 'home');
  });

  it('has a blocks array with header and section', () => {
    const view = buildAppHomeView();
    assert.ok(Array.isArray(view.blocks));
    assert.ok(view.blocks.length >= 4);
    assert.strictEqual(view.blocks[0].type, 'header');
    assert.strictEqual(view.blocks[1].type, 'section');
  });

  it('lists every available command', () => {
    const view = buildAppHomeView();
    const mrkdwnTexts = view.blocks.filter((b) => b.type === 'section').map((b) => b.text.text);
    const commandsText = mrkdwnTexts.join('\n');
    for (const command of ['/jarvis-help', '/jarvis-ping', '/jarvis-catfact', '/jarvis-joke']) {
      assert.ok(commandsText.includes(command), `missing ${command}`);
    }
  });

  it('shows online status', () => {
    const view = buildAppHomeView();
    const mrkdwnTexts = view.blocks.filter((b) => b.type === 'section').map((b) => b.text.text);
    const statusText = mrkdwnTexts.find((t) => t.includes('online'));
    assert.ok(statusText);
  });
});
