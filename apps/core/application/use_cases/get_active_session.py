"""
Use Case: Get Active Session

Returns a FocusStateSnapshot for the REST endpoint and the initial WebSocket
payload. Also performs lazy expiry: if the session's planned duration has
elapsed, it marks it as FINISHED and publishes the stopped event.

This is the "calculated on read" expiry approach specified in the project:
no Celery task required — the extension or desktop app calls GET /active/
on connect, and this use case checks/expires the session if needed.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from apps.core.application.events import FocusSessionEventPublisher
from apps.core.domain.entities import FocusSession, FocusStateSnapshot, UserId
from apps.core.domain.repositories import BlockedSiteRepository, FocusSessionRepository


class GetActiveSessionUseCase:
    def __init__(
        self,
        session_repo: FocusSessionRepository,
        blocked_site_repo: BlockedSiteRepository,
        event_publisher: FocusSessionEventPublisher,
    ) -> None:
        self._session_repo = session_repo
        self._blocked_site_repo = blocked_site_repo
        self._event_publisher = event_publisher

    def execute(self, owner_id: UserId) -> FocusStateSnapshot:
        session: Optional[FocusSession] = self._session_repo.get_active_for_user(owner_id)

        if session is not None:
            session = self._maybe_expire(session)

        if session is None or not session.is_active:
            return FocusStateSnapshot(has_active_session=False)

        blocked = self._blocked_site_repo.list_for_user(owner_id, active_only=True)
        return FocusStateSnapshot(
            has_active_session=True,
            session=session,
            blocked_domains=[s.domain for s in blocked],
        )

    def _maybe_expire(self, session: FocusSession) -> FocusSession:
        """If the session has exceeded its planned duration, finish it."""
        if session.planned_duration_minutes is None:
            return session

        deadline = session.started_at + timedelta(minutes=session.planned_duration_minutes)
        if datetime.utcnow() >= deadline:
            now = datetime.utcnow()
            session.finish(now)
            session = self._session_repo.save(session)
            from apps.core.application.use_cases.stop_focus_session import (
                StopFocusSessionUseCase,
            )
            self._event_publisher.publish_session_stopped(
                StopFocusSessionUseCase._build_payload(session)
            )
        return session
