import { tool } from '@openai/agents';
import { z } from 'zod';

/** Active reminder timers, keyed by timer id. */
const activeTimers = new Set();

/**
 * Schedule a reminder that posts to the originating Slack conversation.
 * Reminders live in-process only — they are lost if the bot restarts.
 * @param {{ minutes: number, text: string, client: import('@slack/web-api').WebClient, channelId: string, threadTs?: string, timer?: (fn: () => void, ms: number) => unknown }} options
 * @returns {unknown} the timer id
 */
export function scheduleReminder({ minutes, text, client, channelId, threadTs, timer = setTimeout }) {
  const clamped = Math.min(1440, Math.max(1, Math.floor(minutes)));
  const id = timer(() => {
    activeTimers.delete(id);
    client.chat
      .postMessage({
        channel: channelId,
        ...(threadTs ? { thread_ts: threadTs } : {}),
        text: `:alarm_clock: Reminder: ${text}`,
      })
      .catch(() => {});
  }, clamped * 60_000);
  activeTimers.add(id);
  return id;
}

/** Clear all pending reminders (used by tests). */
export function clearReminders() {
  activeTimers.clear();
}

/** Reminder tool for Jarvis. */
export const setReminder = tool({
  name: 'set_reminder',
  description:
    'Set a reminder that Jarvis will post into the conversation after the given number of minutes. ' +
    'Use this when the user asks to be reminded about something later.',
  parameters: z.object({
    minutes: z.number().int().min(1).max(1440).describe('Minutes until the reminder fires (1 to 1440).'),
    text: z.string().min(1).max(500).describe('What the reminder should say.'),
  }),
  execute: async ({ minutes, text }, context) => {
    const deps = /** @type {import('../deps.js').AgentDeps} */ (context?.context);
    scheduleReminder({
      minutes,
      text,
      client: deps.client,
      channelId: deps.channelId,
      threadTs: deps.threadTs,
    });
    return `Reminder set for ${minutes} minute(s) from now: "${text}"`;
  },
});
