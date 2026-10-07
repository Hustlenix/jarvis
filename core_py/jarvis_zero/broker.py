from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from .capabilities import CapabilitySet


@dataclass(frozen=True, slots=True)
class StructuredAction:
    kind: str
    target: str = ""
    arguments: dict[str, Any] = field(default_factory=dict)


Executor = Callable[[StructuredAction], Any]


class ExecutionBroker:
    """Maps typed actions to explicitly registered executors and capability checks."""

    def __init__(self) -> None:
        self._executors: dict[str, tuple[str, Executor]] = {}

    def register(self, kind: str, required_capability: str, executor: Executor) -> None:
        if kind == "shell.raw":
            raise ValueError("raw shell execution is intentionally unsupported")
        if kind in self._executors:
            raise ValueError(f"executor already registered: {kind}")
        self._executors[kind] = (required_capability, executor)

    def execute(self, action: StructuredAction, capabilities: CapabilitySet) -> Any:
        try:
            required, executor = self._executors[action.kind]
        except KeyError as exc:
            raise PermissionError(f"unregistered action type: {action.kind}") from exc

        requested = required.format(target=action.target)
        if not capabilities.allows(requested):
            raise PermissionError(f"missing capability: {requested}")
        return executor(action)
