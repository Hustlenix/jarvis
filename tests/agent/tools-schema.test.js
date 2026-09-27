/**
 * Regression guard for the JSON Schema that actually goes over the wire to the
 * Hack Club AI proxy.
 *
 * The proxy validates each tool's `parameters` with a strict JSON Schema
 * validator and rejects the ENTIRE chat-completions request when it meets a
 * `format` keyword it does not recognise. Zod's `z.string().url()` emits
 * `format: "uri"`, which the proxy refuses with:
 *
 *   invalid_function_parameters: Invalid schema for function 'fetch_url':
 *   In context=('properties', 'url'), 'uri' is not a valid format.
 *
 * That is a 400 on the completion call, so one bad keyword breaks every AI
 * reply in the bot — not just the affected tool. This test therefore runs the
 * real agent against a local stub endpoint and inspects the bytes the OpenAI
 * SDK actually serialised, rather than trusting a schema converter.
 */
import assert from 'node:assert';
import http from 'node:http';
import { afterEach, describe, it } from 'node:test';
import { resetAiClient, runAgent } from '../../agent/agent.js';
import { AgentDeps } from '../../agent/deps.js';

const SAVED = { ...process.env };

afterEach(() => {
  process.env = { ...SAVED };
  resetAiClient();
});

/**
 * Recursively collect every object key named `format` in a JSON Schema tree.
 *
 * @param {unknown} node
 * @param {string[]} [path]
 * @returns {string[]} dotted path of each `format` occurrence
 */
function findFormatKeys(node, path = []) {
  if (Array.isArray(node)) return node.flatMap((item, i) => findFormatKeys(item, [...path, String(i)]));
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) => {
    const here = [...path, key];
    if (key === 'format') return [here.join('.')];
    return findFormatKeys(value, here);
  });
}

/**
 * Run the agent against a local stub that records the request body, then reply
 * with a plain one-turn completion so no tool is ever invoked.
 *
 * @returns {Promise<Record<string, any>>} the recorded request body
 */
async function captureAgentRequestBody() {
  /** @type {Record<string, any> | undefined} */
  let captured;

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        captured = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        captured = { __parseError: Buffer.concat(chunks).toString('utf8') };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          id: 'chatcmpl-stub',
          object: 'chat.completion',
          created: 1,
          model: 'openai/gpt-4o-mini',
          choices: [{ index: 0, message: { role: 'assistant', content: 'stub reply' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());

  try {
    process.env.HACKCLUB_AI_API_KEY = 'test_key';
    process.env.HACKCLUB_AI_BASE_URL = `http://127.0.0.1:${port}/v1`;
    delete process.env.HACKCLUB_AI_MODEL;
    resetAiClient();

    // A client with no working methods: if the agent tried to call a tool, this
    // would throw, which is exactly what we want (no tools should run here).
    const deps = new AgentDeps({ reactions: { add: async () => ({}) } }, 'U', 'C', '1.0', '1.0');
    await runAgent('Say hi in two words', deps);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  assert.ok(captured, 'the stub server never received a request');
  return /** @type {Record<string, any>} */ (captured);
}

describe('tool schemas sent to the Hack Club proxy', () => {
  it('never sends a JSON Schema `format` keyword (the proxy 400s on it)', async () => {
    const body = await captureAgentRequestBody();
    const tools = body.tools ?? [];
    assert.ok(Array.isArray(tools) && tools.length > 0, 'expected tools to be sent');

    for (const tool of tools) {
      const params = tool.function?.parameters;
      if (params === undefined) continue;
      assert.deepStrictEqual(
        findFormatKeys(params),
        [],
        `tool "${tool.function?.name}" emitted a format keyword the proxy rejects`,
      );
    }
  });

  it('sends fetch_url with a standard `pattern` constraint instead', async () => {
    const body = await captureAgentRequestBody();
    const fetchUrl = (body.tools ?? []).find((t) => t.function?.name === 'fetch_url');
    assert.ok(fetchUrl, 'fetch_url should be registered as a tool');

    const url = fetchUrl.function.parameters?.properties?.url;
    assert.strictEqual(url.type, 'string');
    assert.strictEqual(typeof url.pattern, 'string', 'url should be constrained with a JSON Schema pattern');
    assert.ok(url.pattern.toLowerCase().startsWith('^https'), 'pattern should require an http(s) scheme');
    assert.strictEqual(url.maxLength, 2048);
  });

  it('sends every tool the agent advertises', async () => {
    const body = await captureAgentRequestBody();
    const names = (body.tools ?? []).map((t) => t.function?.name).sort();
    assert.deepStrictEqual(names, [
      'add_emoji_reaction',
      'fetch_url',
      'get_top_news',
      'get_weather',
      'set_reminder',
      'web_search',
    ]);
  });
});
