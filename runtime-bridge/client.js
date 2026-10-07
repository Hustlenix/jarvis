import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, delimiter, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORE_PY = resolve(HERE, '..', 'core_py');

export class JarvisCoreClient {
  constructor({ python = process.env.JARVIS_PYTHON || 'python', stateDb = ':memory:' } = {}) {
    this.pending = new Map();
    this.stderr = '';
    const pythonPath = [CORE_PY, process.env.PYTHONPATH].filter(Boolean).join(delimiter);
    this.child = spawn(python, ['-m', 'jarvis_zero.bridge'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: pythonPath, JARVIS_STATE_DB: stateDb },
    });

    readline.createInterface({ input: this.child.stdout }).on('line', (line) => this.#onLine(line));
    this.child.stderr.on('data', (chunk) => {
      this.stderr += String(chunk);
      if (this.stderr.length > 8192) this.stderr = this.stderr.slice(-8192);
    });
    this.child.on('exit', (code, signal) => {
      const error = new Error(
        'JARVIS core exited (code=' + code + ', signal=' + signal + ') ' + this.stderr,
      );
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
  }

  request(op, payload = {}, timeoutMs = 5000) {
    if (!this.child.stdin.writable) return Promise.reject(new Error('JARVIS core stdin is not writable'));
    const requestId = randomUUID();
    const message = JSON.stringify({ request_id: requestId, op, ...payload });
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('JARVIS core request timed out: ' + op));
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(requestId, { resolve: resolvePromise, reject, timer });
      this.child.stdin.write(message + '\n');
    });
  }

  async health() {
    return await this.request('health');
  }

  async close() {
    if (!this.child.killed) {
      this.child.stdin.end();
      await new Promise((resolvePromise) => this.child.once('exit', resolvePromise));
    }
  }

  #onLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    const pending = this.pending.get(message.request_id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.request_id);
    if (message.ok) pending.resolve(message);
    else pending.reject(new Error(message.error || 'JARVIS core request failed'));
  }
}
