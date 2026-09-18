"""
Use Case: Stop Focus Session

Marks an ACTIVE focus session as FINISHED.
Publishes a 'session_stopped' event to connected WebSocket clients.

The caller (view) passes the requesting user's ID; we verify ownership
through the repository query (returns None if wrong owner → 404).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from apps.core.application.events import FocusSessionEventPublisher
from apps.core.domain.entities import FocusSession, FocusSessionId, UserId
from apps.core.domain.exceptions import SessionNotActiveError, SessionNotFoundError
from apps.core.domain.repositories import FocusSessionRepository


class StopFocusSessionUseCase:
    def __init__(
        self,
        session_repo: FocusSessionRepository,
        event_publisher: FocusSessionEventPublisher,
    ) -> None:
        self._session_repo = session_repo
        self._event_publisher = event_publisher

    def execute(self, session_id: FocusSessionId, owner_id: UserId) -> FocusSession:
        session = self._session_repo.get_by_id(session_id, owner_id)
        if session is None:
            raise SessionNotFoundError(session_id)
        if not session.is_active:
            raise SessionNotActiveError(session_id)

        now = datetime.utcnow()
        session.finish(now)
        saved = self._session_repo.save(session)

        self._event_publisher.publish_session_stopped(
            self._build_payload(saved)
        )
        return saved

    @staticmethod
    def _build_payload(session: FocusSession) -> dict[str, Any]:
        return {
            "type": "session_stopped",
            "session_id": session.id,
            "owner_id": session.owner_id,
            "started_at": session.started_at.isoformat(),
            "planned_duration_minutes": session.planned_duration_minutes,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "blocked_domains": [],
        }
