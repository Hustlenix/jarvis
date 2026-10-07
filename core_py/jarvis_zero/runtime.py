from __future__ import annotations

from collections.abc import Callable
from typing import Any

from .dag import TaskGraph
from .model import Task, TaskStatus
from .state import SQLiteTaskStore

Worker = Callable[[Task], Any]


class JarvisRuntime:
    """Smallest useful runtime: dependency-safe tasks, persistence, retry-safe terminal states."""

    def __init__(self, store: SQLiteTaskStore | None = None) -> None:
        self.store = store or SQLiteTaskStore()
        self.graph = TaskGraph(self.store.load_all())

    def submit(self, task: Task) -> Task:
        self.graph.add(task)
        self.store.upsert(task)
        return task

    def ready(self) -> list[Task]:
        ready = self.graph.ready()
        self._persist_all()
        return ready

    def transition(self, task_id: str, status: TaskStatus, **kwargs: Any) -> Task:
        task = self.graph.transition(task_id, status, **kwargs)
        self._persist_all()
        return task

    def run_once(self, worker: Worker) -> list[Task]:
        completed: list[Task] = []
        for task in self.ready():
            self.transition(task.task_id, TaskStatus.RUNNING)
            try:
                result = worker(task)
            except Exception as exc:
                completed.append(self.transition(task.task_id, TaskStatus.FAILED, error=f"{type(exc).__name__}: {exc}"))
            else:
                completed.append(self.transition(task.task_id, TaskStatus.DONE, result=result))
        return completed

    def _persist_all(self) -> None:
        for task in self.graph.tasks:
            self.store.upsert(task)
