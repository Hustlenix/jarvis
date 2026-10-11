/**
 * Safe connectivity check for the Hack Club AI proxy.
 * No response bodies, request headers, or secrets are logged.
 *
 * @param {{
 *   apiKey: string,
 *   baseURL: string,
 *   model: string,
 *   fetchImpl?: typeof fetch
 * }} options
 * @returns {Promise<{ model: string, reachable: true }>}
 */
export async function probeHackClubAi({ apiKey, baseURL, model, fetchImpl = fetch }) {
  if (!apiKey?.trim()) {
    throw new Error('HACKCLUB_AI_API_KEY is missing');
  }

  let response;
  try {
    response = await fetchImpl(`${baseURL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly PONG.' }],
        stream: false,
        // max_completion_tokens supersedes the legacy max_tokens field for
        // new reasoning models. GPT-6 Luna requires none for Chat Completions
        // function calling in the production agent.
        max_completion_tokens: 64,
        ...(model === 'openai/gpt-6-luna' ? { reasoning_effort: 'none' } : {}),
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('Hack Club AI is unreachable or timed out');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Hack Club AI rejected the key (401/403)');
    }
    if (response.status === 429) {
      throw new Error('Hack Club AI rate limit or quota (429)');
    }
    if (response.status === 400 || response.status === 404) {
      throw new Error(`Hack Club AI rejected the requested model or endpoint (${response.status})`);
    }
    throw new Error(`Hack Club AI returned HTTP ${response.status}`);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Hack Club AI returned a non-JSON response');
  }
  const text = result?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Hack Club AI returned no text; check model compatibility');
  }

  return { model, reachable: true };
}
