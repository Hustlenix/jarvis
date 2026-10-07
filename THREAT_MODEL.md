# JARVIS ZERO — Threat Model

## Protected assets

Repository integrity, operator secrets, task/evaluation history, capability policy, local machine resources, and external accounts/actions.

## Initial threats

Prompt injection attempting to expand scope; forged or malformed agent messages; path traversal through scoped file capabilities; arbitrary raw-shell requests; cyclic or duplicated tasks; worker crashes and partial execution; corrupted persisted state; false success reports; runaway queues/resource use; and one interface adapter gaining authority over the entire runtime.

## Phase One mitigations

- typed protocol objects and bounded confidence values
- DAG cycle checks and dependency gates
- terminal-state propagation rather than silent task loss
- deny-by-default capability checks with path traversal rejection
- execution broker refuses unregistered action kinds and explicitly disallows shell.raw
- SQLite persistence provides restart reconstruction for task state
- bounded native queue prevents unbounded enqueue growth in the first C++ primitive
- JavaScript communicates with Python through a narrow operation allowlist

## Known gaps

Cryptographic message authentication, append-only audit storage, evaluator isolation, OS-level sandboxing, per-worker process supervision, capability expiry, rate budgets, secure secret storage, and corruption recovery are not yet implemented. They remain required before JARVIS is treated as a high-autonomy runtime.
