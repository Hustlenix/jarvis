import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SYSTEM_PROMPT } from '../../agent/system-prompt.js';

describe('Jarvis instruction policy', () => {
  it('allows complete multi-part answers rather than imposing a fixed three-sentence limit', () => {
    assert.match(SYSTEM_PROMPT, /multi-part requests/);
    assert.match(SYSTEM_PROMPT, /cover EVERY requested part/);
    assert.match(SYSTEM_PROMPT, /NEVER refuse merely because/);
    assert.doesNotMatch(SYSTEM_PROMPT, /Keep replies to 3 sentences max/i);
  });

  it('requires truthful limitations and credential handling', () => {
    assert.match(SYSTEM_PROMPT, /Never reveal, print or reproduce API tokens/);
    assert.match(SYSTEM_PROMPT, /Do not invent tool results/);
    assert.match(SYSTEM_PROMPT, /not durable across service restarts/);
    assert.match(SYSTEM_PROMPT, /untrusted inputs/);
  });
});
