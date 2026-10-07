from __future__ import annotations

import json
import os
import sys
from typing import Any

from .model import Task, TaskStatus
from .runtime import JarvisRuntime
from .state import SQLiteTaskStore


def _reply(request_id: str, *, ok: bool, **payload: Any) -> None:
    print(json.dumps({"request_id": request_id, "ok": ok, **payload}, separators=(",", ":")), flush=True)


def _handle(runtime: JarvisRuntime, request: dict[str, Any]) -> dict[str, Any]:
    op = request.get("op")
    if op == "health":
        return {"status": "ok", "tasks": len(runtime.graph.tasks)}
    if op == "submit_task":
        task = runtime.submit(Task.from_dict(request["task"]))
        return {"task": task.to_dict()}
    if op == "ready":
        return {"tasks": [task.to_dict() for task in runtime.ready()]}
    if op == "transition":
        task = runtime.transition(
            str(request["task_id"]),
            TaskStatus(str(request["status"])),
            result=request.get("result"),
            error=request.get("error"),
        )
        return {"task": task.to_dict()}
    raise ValueError(f"unsupported op: {op!r}")


def main() -> int:
    store = SQLiteTaskStore(os.environ.get("JARVIS_STATE_DB", ":memory:"))
    runtime = JarvisRuntime(store)
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        request_id = ""
        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise ValueError("request must be a JSON object")
            request_id = str(request.get("request_id", ""))
            if not request_id:
                raise ValueError("request_id is required")
            _reply(request_id, ok=True, **_handle(runtime, request))
        except Exception as exc:
            _reply(request_id, ok=False, error=f"{type(exc).__name__}: {exc}")
    store.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
