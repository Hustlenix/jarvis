from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath


def _split(capability: str) -> tuple[str, str | None]:
    name, separator, scope = capability.partition(":")
    if not name:
        raise ValueError("capability name is required")
    return name, scope if separator else None


def _safe_scope(scope: str) -> PurePosixPath:
    path = PurePosixPath(scope)
    if ".." in path.parts:
        raise ValueError("capability scope may not contain '..'")
    return path


@dataclass(frozen=True, slots=True)
class CapabilitySet:
    grants: tuple[str, ...] = ()

    def allows(self, requested: str) -> bool:
        req_name, req_scope = _split(requested)
        for grant in self.grants:
            grant_name, grant_scope = _split(grant)
            if grant_name != req_name:
                continue
            if grant_scope is None:
                if req_scope is None:
                    return True
                continue
            if req_scope is None:
                continue
            root = _safe_scope(grant_scope)
            candidate = _safe_scope(req_scope)
            if candidate == root or root in candidate.parents:
                return True
        return False
