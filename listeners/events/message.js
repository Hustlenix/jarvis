import { AgentDeps, runAgent } from '../../agent/index.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';
import { buildAiErrorText, extractReply, safeSetStatus } from './shared.js';

/**
 * @param {import('@slack/types').MessageEvent} event
 * @returns {event is import('@slack/types').GenericMessageEvent}
 */
function isGenericMessageEvent(event) {
  return !('subtype' in event && event.subtype !== undefined);
}

/**
 * Handle messages sent to the agent via DM or in threads the bot is part of.
 *
 * Reply-loop protection, in layers:
 *   1. Bolt runs with `ignoreSelf: true`, so our own posts never reach us.
 *   2. `event.bot_id` skips anything posted by any bot, including other bots.
 *   3. Top-level channel messages are ignored — `app_mention` owns those — so
 *      Jarvis cannot answer every message in a busy channel.
 *
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'message'>} args
 * @returns {Promise<void>}
 */
export async function handleMessage({ client, context, event, logger, say, sayStream, setStatus }) {
  // Skip message subtypes (edits, deletes, etc.)
  if (!isGenericMessageEvent(event)) return;

  // Skip bot messages — this is what stops bot-to-bot reply loops.
  if (event.bot_id) return;

  const isDm = event.channel_type === 'im';
  const isThreadReply = !!event.thread_ts;

  if (isDm) {
    // DMs are always handled
  } else if (isThreadReply) {
    // Channel thread replies are handled only if the bot is already engaged
    const history = conversationStore.getHistory(event.channel, /** @type {string} */ (event.thread_ts));
    if (history === null) return;
  } else {
    // Top-level channel messages are handled by app_mention
    return;
  }

  const threadTs = event.thread_ts || event.ts;
  try {
    const channelId = event.channel;
    const text = (event.text || '').trim();
    const userId = /** @type {string} */ (context.userId);

    if (text.length === 0) return;

    await safeSetStatus(setStatus, logger);

    const history = conversationStore.getHistory(channelId, threadTs);
    /** @type {string | import('@openai/agents').AgentInputItem[]} */
    const inputItems = history ? [...history, { role: 'user', content: text }] : text;

    const deps = new AgentDeps(client, userId, channelId, threadTs, event.ts);
    const result = await runAgent(inputItems, deps);

    const reply = extractReply(result.finalOutput);
    if (reply === null) {
      await say({ text: 'I thought about it but came back with nothing. Try rephrasing?', thread_ts: threadTs });
      return;
    }

    const streamer = sayStream();
    await streamer.append({ markdown_text: reply });
    await streamer.stop({ blocks: buildFeedbackBlocks() });

    conversationStore.setHistory(channelId, threadTs, result.history);
  } catch (e) {
    logger.error(`Failed to handle message: ${e instanceof Error ? e.message : String(e)}`);
    await say({ text: buildAiErrorText(e), thread_ts: threadTs });
  }
}
