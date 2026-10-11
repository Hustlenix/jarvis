import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifySlackInstallation } from '../scripts/slack-installation.js';

const args = {
  appToken: 'xapp-1-A123-example',
  bot: { team_id: 'T123', is_enterprise_install: false },
  botInfo: { app_id: 'A123' },
};

test('accepts a matched workspace installation', () => {
  assert.deepEqual(verifySlackInstallation(args), { appId: 'A123', teamId: 'T123' });
});

test('rejects independently valid credentials from different apps without revealing tokens', () => {
  assert.throws(
    () => verifySlackInstallation({ ...args, appToken: 'xapp-1-A456-secret-value' }),
    (error) =>
      error instanceof Error && /different apps/.test(error.message) && !error.message.includes('secret-value'),
  );
});

test('does not count enterprise authentication as workspace access', () => {
  assert.throws(
    () => verifySlackInstallation({ ...args, bot: { team_id: 'E123', is_enterprise_install: true } }),
    /workspace access/,
  );
});

test('rejects absent workspace identity', () => {
  assert.throws(() => verifySlackInstallation({ ...args, bot: {} }), /installed workspace/);
});
