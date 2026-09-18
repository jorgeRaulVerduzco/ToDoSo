"""
Use Case: Get Session Statistics

Computes aggregate stats from the user's session history.
Pure calculation — no side effects.

Returns:
  {
    "total_sessions": int,
    "completed_sessions": int,
    "cancelled_sessions": int,
    "total_focus_minutes": int,  # sum of actual duration for finished sessions
  }
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from apps.core.domain.entities import SessionStatus, UserId
from apps.core.domain.repositories import FocusSessionRepository


@dataclass(frozen=True)
class SessionStats:
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    total_focus_minutes: int


class GetSessionStatsUseCase:
    def __init__(self, session_repo: FocusSessionRepository) -> None:
        self._repo = session_repo

    def execute(self, owner_id: UserId) -> SessionStats:
        all_sessions = self._repo.list_for_user(owner_id)

        completed = [s for s in all_sessions if s.status == SessionStatus.FINISHED]
        cancelled = [s for s in all_sessions if s.status == SessionStatus.CANCELLED]

        total_minutes = 0
        for s in completed:
            if s.ended_at and s.started_at:
                delta: timedelta = s.ended_at - s.started_at
                total_minutes += int(delta.total_seconds() // 60)

        return SessionStats(
            total_sessions=len(all_sessions),
            completed_sessions=len(completed),
            cancelled_sessions=len(cancelled),
            total_focus_minutes=total_minutes,
        )
