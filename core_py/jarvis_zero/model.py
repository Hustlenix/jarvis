from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from time import time
from typing import Any
from uuid import uuid4


class TaskStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    NEEDS_HUMAN = "NEEDS_HUMAN"
    CANCELLED = "CANCELLED"


TERMINAL_STATES = {
    TaskStatus.DONE,
    TaskStatus.FAILED,
    TaskStatus.BLOCKED,
    TaskStatus.NEEDS_HUMAN,
    TaskStatus.CANCELLED,
}


class MessageType(StrEnum):
    TASK = "TASK"
    RESULT = "RESULT"
    QUESTION = "QUESTION"
    CHALLENGE = "CHALLENGE"
    EVIDENCE = "EVIDENCE"
    FAILURE = "FAILURE"
    BLOCKED = "BLOCKED"
    REVIEW = "REVIEW"
    ALERT = "ALERT"


@dataclass(slots=True)
class Task:
    task_id: str
    objective: str
    dependencies: tuple[str, ...] = ()
    priority: int = 50
    owner: str | None = None
    status: TaskStatus = TaskStatus.PENDING
    attempts: int = 0
    result: Any = None
    error: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time)
    updated_at: float = field(default_factory=time)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["status"] = self.status.value
        data["dependencies"] = list(self.dependencies)
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Task":
        payload = dict(data)
        payload["dependencies"] = tuple(payload.get("dependencies", ()))
        payload["status"] = TaskStatus(payload.get("status", TaskStatus.PENDING))
        return cls(**payload)


@dataclass(slots=True)
class AgentMessage:
    sender: str
    recipient: str
    task_id: str
    message_type: MessageType
    payload: dict[str, Any]
    priority: int = 50
    confidence: float = 0.5
    dependencies: tuple[str, ...] = ()
    evidence: tuple[str, ...] = ()
    message_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: float = field(default_factory=time)

    def __post_init__(self) -> None:
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        if not self.sender or not self.recipient or not self.task_id:
            raise ValueError("sender, recipient, and task_id are required")
