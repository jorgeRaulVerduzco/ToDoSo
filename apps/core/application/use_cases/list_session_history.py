"""
Use Case: List Session History

Returns past focus sessions for a user, with optional status filter.
Used for the /history/ endpoint.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from apps.core.domain.entities import FocusSession, SessionStatus, UserId
from apps.core.domain.repositories import FocusSessionRepository


@dataclass(frozen=True)
class ListSessionHistoryInput:
    owner_id: UserId
    status: Optional[SessionStatus] = None


class ListSessionHistoryUseCase:
    def __init__(self, session_repo: FocusSessionRepository) -> None:
        self._repo = session_repo

    def execute(self, data: ListSessionHistoryInput) -> list[FocusSession]:
        return self._repo.list_for_user(data.owner_id, status=data.status)
