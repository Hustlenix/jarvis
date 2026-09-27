import assert from 'node:assert';
import { describe, it } from 'node:test';

import { checkEnvironment } from '../config.js';

const COMPLETE = { SLACK_BOT_TOKEN: 'xoxb-fake', SLACK_APP_TOKEN: 'xapp-fake' };

describe('checkEnvironment', () => {
  it('passes when both Slack tokens and the AI key are present', () => {
    const result = checkEnvironment({ ...COMPLETE, HACKCLUB_AI_API_KEY: 'hc_fake' });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.missing, []);
    assert.strictEqual(result.fatalMessage, null);
    assert.deepStrictEqual(result.warnings, []);
  });

  it('fails and names the missing token', () => {
    const result = checkEnvironment({ SLACK_APP_TOKEN: 'xapp-fake' });
    assert.strictEqual(result.ok, false);
    assert.deepStrictEqual(result.missing, ['SLACK_BOT_TOKEN']);
    assert.ok(result.fatalMessage.includes('SLACK_BOT_TOKEN'));
    assert.ok(result.fatalMessage.includes('variable:'), 'should use the singular form');
  });

  it('uses the plural form when both are missing', () => {
    const result = checkEnvironment({});
    assert.deepStrictEqual(result.missing, ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN']);
    assert.ok(result.fatalMessage.includes('variables:'));
  });

  it('treats a whitespace-only token as missing', () => {
    const result = checkEnvironment({ SLACK_BOT_TOKEN: '   ', SLACK_APP_TOKEN: 'xapp-fake' });
    assert.strictEqual(result.ok, false);
    assert.deepStrictEqual(result.missing, ['SLACK_BOT_TOKEN']);
  });

  it('warns but still starts when only the AI key is missing', () => {
    const result = checkEnvironment({ ...COMPLETE });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.fatalMessage, null);
    assert.strictEqual(result.warnings.length, 1);
    assert.ok(result.warnings[0].includes('HACKCLUB_AI_API_KEY'));
  });

  it('warns when the AI key is only whitespace', () => {
    const result = checkEnvironment({ ...COMPLETE, HACKCLUB_AI_API_KEY: '   ' });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.warnings.length, 1);
  });

  it('never echoes secret values into the message', () => {
    const result = checkEnvironment({ SLACK_BOT_TOKEN: 'xoxb-super-secret', SLACK_APP_TOKEN: '' });
    assert.ok(!result.fatalMessage.includes('xoxb-super-secret'));
  });

  it('defaults to the live process environment', () => {
    const result = checkEnvironment();
    assert.strictEqual(typeof result.ok, 'boolean');
  });
});
