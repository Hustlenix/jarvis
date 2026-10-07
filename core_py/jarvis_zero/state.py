from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import RLock

from .model import Task


class SQLiteTaskStore:
    def __init__(self, path: str | Path = ":memory:") -> None:
        self._lock = RLock()
        self._connection = sqlite3.connect(str(path), check_same_thread=False)
        with self._connection:
            self._connection.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    task_id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL
                )
                """
            )

    def upsert(self, task: Task) -> None:
        payload = json.dumps(task.to_dict(), separators=(",", ":"), sort_keys=True)
        with self._lock, self._connection:
            self._connection.execute(
                "INSERT INTO tasks(task_id, payload) VALUES(?, ?) "
                "ON CONFLICT(task_id) DO UPDATE SET payload=excluded.payload",
                (task.task_id, payload),
            )

    def load_all(self) -> list[Task]:
        with self._lock:
            rows = self._connection.execute("SELECT payload FROM tasks ORDER BY task_id").fetchall()
        return [Task.from_dict(json.loads(payload)) for (payload,) in rows]

    def close(self) -> None:
        with self._lock:
            self._connection.close()
