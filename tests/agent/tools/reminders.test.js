import assert from 'node:assert';
import { describe, it } from 'node:test';

import { clearReminders, scheduleReminder } from '../../../agent/tools/reminders.js';

describe('scheduleReminder', () => {
  it('schedules and posts the reminder to the channel', () => {
    const posted = [];
    let fired;
    const fakeTimer = (fn) => {
      fired = fn;
      return 42;
    };
    const client = { chat: { postMessage: async (payload) => posted.push(payload) } };

    scheduleReminder({
      minutes: 5,
      text: 'Drink water',
      client,
      channelId: 'C123',
      threadTs: 'T456',
      timer: fakeTimer,
    });

    assert.strictEqual(typeof fired, 'function');
    fired();
    assert.strictEqual(posted.length, 1);
    assert.strictEqual(posted[0].channel, 'C123');
    assert.strictEqual(posted[0].thread_ts, 'T456');
    assert.ok(posted[0].text.includes('Drink water'));
    clearReminders();
  });

  it('clamps minutes to the 1-1440 range', () => {
    const delays = [];
    const fakeTimer = (_fn, ms) => {
      delays.push(ms);
      return 1;
    };
    const client = { chat: { postMessage: async () => {} } };

    scheduleReminder({ minutes: 0, text: 'a', client, channelId: 'C', timer: fakeTimer });
    scheduleReminder({ minutes: 9999, text: 'b', client, channelId: 'C', timer: fakeTimer });
    scheduleReminder({ minutes: 10.7, text: 'c', client, channelId: 'C', timer: fakeTimer });

    assert.deepStrictEqual(delays, [60_000, 86_400_000, 10 * 60_000]);
    clearReminders();
  });

  it('does not crash when posting fails', () => {
    let fired;
    const fakeTimer = (fn) => {
      fired = fn;
      return 1;
    };
    const client = {
      chat: {
        postMessage: async () => {
          throw new Error('channel gone');
        },
      },
    };

    scheduleReminder({ minutes: 1, text: 'x', client, channelId: 'C', timer: fakeTimer });
    fired();
    clearReminders();
  });
});
