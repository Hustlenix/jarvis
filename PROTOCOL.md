# JARVIS ZERO — Protocol

## Agent message envelope

Every inter-agent message carries structured fields equivalent to message_id, sender, recipient, task_id, message_type, priority, confidence, dependencies, evidence, payload, and timestamp.

Supported message types start with TASK, RESULT, QUESTION, CHALLENGE, EVIDENCE, FAILURE, BLOCKED, REVIEW, and ALERT.

Confidence is bounded to [0, 1]. Natural-language text may exist inside payload, but routing and lifecycle decisions must not depend on parsing uncontrolled prose.

## JavaScript ↔ Python bridge

Transport is newline-delimited JSON over stdio.

Each request contains request_id and op. Phase One operations are health, submit_task, ready, and transition.

Every response echoes request_id and includes ok=true or ok=false. Errors are data, not process crashes.

This bridge is not an unrestricted command channel. Additional operations must be registered explicitly and receive dedicated tests and capability rules.
