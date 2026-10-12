import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { register } from '../../../listeners/commands/index.js';
import { COMMAND_NAMES } from '../../../listeners/commands/names.js';

const expectedNames = Object.values(COMMAND_NAMES).sort();

describe('slash-command registration', () => {
  it('registers exactly the canonical commands in Bolt', () => {
    const registered = [];
    register({ command: (name, handler) => registered.push({ name, handler }) });

    assert.deepEqual(registered.map(({ name }) => name).sort(), expectedNames);
    assert.ok(registered.every(({ handler }) => typeof handler === 'function'));
  });

  it('keeps the Slack manifest aligned with the Bolt routes', () => {
    const manifest = JSON.parse(readFileSync(new URL('../../../manifest.json', import.meta.url), 'utf8'));
    const manifestNames = manifest.features.slash_commands.map(({ command }) => command).sort();

    assert.deepEqual(manifestNames, expectedNames);
  });
});
