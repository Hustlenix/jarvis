from __future__ import annotations

from collections import defaultdict
from time import time

from .model import Task, TaskStatus


_ALLOWED_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.PENDING: {TaskStatus.RUNNING, TaskStatus.BLOCKED, TaskStatus.CANCELLED, TaskStatus.NEEDS_HUMAN},
    TaskStatus.RUNNING: {TaskStatus.DONE, TaskStatus.FAILED, TaskStatus.PENDING, TaskStatus.CANCELLED, TaskStatus.NEEDS_HUMAN},
    TaskStatus.DONE: set(),
    TaskStatus.FAILED: set(),
    TaskStatus.BLOCKED: set(),
    TaskStatus.NEEDS_HUMAN: {TaskStatus.PENDING, TaskStatus.CANCELLED},
    TaskStatus.CANCELLED: set(),
}


class TaskGraph:
    def __init__(self, tasks: list[Task] | None = None) -> None:
        self._tasks: dict[str, Task] = {}
        self._dependents: dict[str, set[str]] = defaultdict(set)
        for task in tasks or []:
            self.add(task, validate_dependencies=False)
        self._validate_all_dependencies()
        self._validate_acyclic()
        self.propagate_terminal_failures()

    @property
    def tasks(self) -> tuple[Task, ...]:
        return tuple(self._tasks.values())

    def get(self, task_id: str) -> Task:
        try:
            return self._tasks[task_id]
        except KeyError as exc:
            raise KeyError(f"unknown task: {task_id}") from exc

    def add(self, task: Task, *, validate_dependencies: bool = True) -> None:
        if task.task_id in self._tasks:
            raise ValueError(f"duplicate task id: {task.task_id}")
        if task.task_id in task.dependencies:
            raise ValueError("task cannot depend on itself")
        if validate_dependencies:
            missing = [dep for dep in task.dependencies if dep not in self._tasks]
            if missing:
                raise ValueError(f"missing dependencies: {', '.join(missing)}")
        self._tasks[task.task_id] = task
        for dep in task.dependencies:
            self._dependents[dep].add(task.task_id)
        try:
            self._validate_acyclic()
        except Exception:
            del self._tasks[task.task_id]
            for dep in task.dependencies:
                self._dependents[dep].discard(task.task_id)
            raise

    def ready(self) -> list[Task]:
        self.propagate_terminal_failures()
        ready = [
            task
            for task in self._tasks.values()
            if task.status == TaskStatus.PENDING
            and all(self._tasks[dep].status == TaskStatus.DONE for dep in task.dependencies)
        ]
        return sorted(ready, key=lambda item: (-item.priority, item.created_at, item.task_id))

    def transition(self, task_id: str, new_status: TaskStatus, *, result: object = None, error: str | None = None) -> Task:
        task = self.get(task_id)
        if new_status not in _ALLOWED_TRANSITIONS[task.status]:
            raise ValueError(f"invalid transition {task.status.value} -> {new_status.value}")
        if new_status == TaskStatus.RUNNING and any(
            self._tasks[dep].status != TaskStatus.DONE for dep in task.dependencies
        ):
            raise ValueError("task dependencies are not verified DONE")
        task.status = new_status
        task.updated_at = time()
        if new_status == TaskStatus.RUNNING:
            task.attempts += 1
            task.error = None
        if new_status == TaskStatus.DONE:
            task.result = result
            task.error = None
        elif error:
            task.error = error
        self.propagate_terminal_failures()
        return task

    def propagate_terminal_failures(self) -> None:
        changed = True
        while changed:
            changed = False
            for task in self._tasks.values():
                if task.status != TaskStatus.PENDING:
                    continue
                failed = [
                    dep
                    for dep in task.dependencies
                    if self._tasks[dep].status in {TaskStatus.FAILED, TaskStatus.BLOCKED, TaskStatus.CANCELLED}
                ]
                if failed:
                    task.status = TaskStatus.BLOCKED
                    task.error = f"blocked by terminal dependency: {', '.join(failed)}"
                    task.updated_at = time()
                    changed = True

    def _validate_all_dependencies(self) -> None:
        missing: list[str] = []
        for task in self._tasks.values():
            for dep in task.dependencies:
                if dep not in self._tasks:
                    missing.append(f"{task.task_id}->{dep}")
                else:
                    self._dependents[dep].add(task.task_id)
        if missing:
            raise ValueError(f"missing dependencies: {', '.join(missing)}")

    def _validate_acyclic(self) -> None:
        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(task_id: str) -> None:
            if task_id in visited:
                return
            if task_id in visiting:
                raise ValueError(f"cycle detected at task {task_id}")
            visiting.add(task_id)
            for dep in self._tasks[task_id].dependencies:
                if dep in self._tasks:
                    visit(dep)
            visiting.remove(task_id)
            visited.add(task_id)

        for task_id in self._tasks:
            visit(task_id)
