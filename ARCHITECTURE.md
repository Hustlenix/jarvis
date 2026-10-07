# JARVIS ZERO — Phase One Architecture

## Baseline

The repository currently contains a working JavaScript Slack bot. Phase One preserves it as an interface adapter instead of replacing it.

## New vertical slice

Slack / JavaScript surface → JSON-lines request/response → Python JARVIS kernel → measured native boundaries → C++ runtime candidates.

The Python kernel owns typed task state, dependency gating, SQLite persistence, capability checks, and structured execution. The JavaScript bridge is intentionally narrow and cannot send arbitrary shell commands. C++ is introduced only behind measured boundaries; Phase One does not migrate Python work merely to increase native-code volume.

## Task invariants

- Dependencies must exist and the graph must remain acyclic.
- A task cannot enter RUNNING until all dependencies are verified DONE.
- Terminal dependency failure propagates to dependent work as BLOCKED.
- Accepted tasks must remain visible in a deterministic terminal or active state.
- Runtime state is persisted through SQLite so restart recovery can reconstruct tasks.

## Next architectural steps

Add leases/ownership, retries with budgets, append-only event history, an independent evaluator, agent lifecycle supervision, context compilation, model routing, and chaos tests before attempting high-autonomy workloads.
