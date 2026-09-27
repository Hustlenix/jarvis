import { AgentDeps, runAgent } from '../../agent/index.js';
import { conversationStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';
import { buildAiErrorText, extractReply, safeSetStatus } from './shared.js';

/**
 * Handle app_mention events and run the agent.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_mention'>} args
 * @returns {Promise<void>}
 */
export async function handleAppMentioned({ client, context, event, logger, say, sayStream, setStatus }) {
  const threadTs = event.thread_ts || event.ts;
  try {
    const channelId = event.channel;
    const userId = /** @type {string} */ (context.userId);

    // Strip the bot mention from the text
    const cleanedText = (event.text || '').replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanedText) {
      await say({
        text: "Hey there! How can I help you? Ask me anything and I'll do my best.",
        thread_ts: threadTs,
      });
      return;
    }

    await safeSetStatus(setStatus, logger);

    const history = conversationStore.getHistory(channelId, threadTs);
    /** @type {string | import('@openai/agents').AgentInputItem[]} */
    const inputItems = history ? [...history, { role: 'user', content: cleanedText }] : cleanedText;

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
    logger.error(`Failed to handle app mention: ${e instanceof Error ? e.message : String(e)}`);
    await say({ text: buildAiErrorText(e), thread_ts: threadTs });
  }
}
