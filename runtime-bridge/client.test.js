import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JarvisCoreClient } from './client.js';

test('JavaScript bridge talks to the Python JARVIS kernel', async (t) => {
  const client = new JarvisCoreClient();
  t.after(async () => await client.close());

  const health = await client.health();
  assert.equal(health.ok, true);
  assert.equal(health.status, 'ok');
  assert.equal(health.tasks, 0);

  const submitted = await client.request('submit_task', {
    task: { task_id: 'bridge-test', objective: 'prove cross-language transport' },
  });
  assert.equal(submitted.task.task_id, 'bridge-test');

  const ready = await client.request('ready');
  assert.deepEqual(ready.tasks.map((task) => task.task_id), ['bridge-test']);
});
