import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { AiUnavailableError, describeAiError, getAiSettings, isAiConfigured, withTimeout } from '../../agent/ai.js';

const SAVED = { ...process.env };

afterEach(() => {
  process.env = { ...SAVED };
});

describe('isAiConfigured', () => {
  it('is false when the key is absent', () => {
    delete process.env.HACKCLUB_AI_API_KEY;
    assert.strictEqual(isAiConfigured(), false);
  });

  it('is false when the key is only whitespace', () => {
    process.env.HACKCLUB_AI_API_KEY = '   ';
    assert.strictEqual(isAiConfigured(), false);
  });

  it('is true when the key has content', () => {
    process.env.HACKCLUB_AI_API_KEY = 'hc_test_key';
    assert.strictEqual(isAiConfigured(), true);
  });
});

describe('getAiSettings', () => {
  it('defaults to the Hack Club proxy and gpt-4o-mini', () => {
    delete process.env.HACKCLUB_AI_BASE_URL;
    delete process.env.HACKCLUB_AI_MODEL;
    const settings = getAiSettings();
    assert.strictEqual(settings.baseURL, 'https://ai.hackclub.com/proxy/v1');
    assert.strictEqual(settings.model, 'openai/gpt-4o-mini');
  });

  it('allows overrides', () => {
    process.env.HACKCLUB_AI_BASE_URL = 'https://example.test/proxy/v1';
    process.env.HACKCLUB_AI_MODEL = 'openai/gpt-4o';
    const settings = getAiSettings();
    assert.strictEqual(settings.baseURL, 'https://example.test/proxy/v1');
    assert.strictEqual(settings.model, 'openai/gpt-4o');
  });

  it('strips a trailing slash so paths do not double up', () => {
    process.env.HACKCLUB_AI_BASE_URL = 'https://ai.hackclub.com/proxy/v1///';
    assert.strictEqual(getAiSettings().baseURL, 'https://ai.hackclub.com/proxy/v1');
  });
});

describe('withTimeout', () => {
  it('resolves when the promise settles in time', async () => {
    const result = await withTimeout(Promise.resolve('done'), 1_000, 'too slow');
    assert.strictEqual(result, 'done');
  });

  it('rejects with AiUnavailableError when the promise stalls', async () => {
    const never = new Promise(() => {});
    await assert.rejects(
      () => withTimeout(never, 10, 'The AI took too long.'),
      (err) => {
        assert.ok(err instanceof AiUnavailableError);
        assert.strictEqual(err.message, 'The AI took too long.');
        return true;
      },
    );
  });

  it('clears its timer so a settled timeout does not keep the process alive', async () => {
    const before = process.getActiveResourcesInfo?.().length ?? 0;
    await withTimeout(Promise.resolve('ok'), 60_000, 'too slow');
    const after = process.getActiveResourcesInfo?.().length ?? 0;
    assert.ok(after <= before + 1, `expected no lingering timer, before=${before} after=${after}`);
  });
});

describe('describeAiError', () => {
  it('passes through our own safe messages', () => {
    assert.strictEqual(describeAiError(new AiUnavailableError('The AI took too long.')), 'The AI took too long.');
  });

  it('maps an auth failure to a key message', () => {
    assert.strictEqual(describeAiError(new Error('401 Unauthorized')), 'the AI API key is missing or invalid');
  });

  it('maps a rate limit to a rate limit message', () => {
    assert.strictEqual(
      describeAiError(new Error('429 rate limit exceeded')),
      'the AI provider is rate limiting us right now',
    );
  });

  it('maps a timeout to a timeout message', () => {
    assert.strictEqual(describeAiError(new Error('Request timed out')), 'the AI provider did not respond in time');
  });

  it('maps a server error to a server error message', () => {
    assert.strictEqual(
      describeAiError(new Error('503 Service Unavailable')),
      'the AI provider returned a server error',
    );
  });

  it('maps a network failure to a reachability message', () => {
    assert.strictEqual(describeAiError(new Error('fetch failed')), 'the AI provider could not be reached');
  });

  it('never leaks the raw error for an unknown failure', () => {
    const secret = 'https://ai.hackclub.com/v1?key=super-secret-token';
    const message = describeAiError(new Error(`Something odd: ${secret}`));
    assert.ok(!message.includes('super-secret-token'));
    assert.ok(!message.includes('ai.hackclub.com'));
    assert.strictEqual(message, 'the AI provider returned an unexpected error');
  });

  it('handles a non-Error throw', () => {
    const message = describeAiError('boom');
    assert.ok(!message.includes('boom'));
  });
});
