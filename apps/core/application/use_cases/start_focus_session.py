"""
Use Case: Start Focus Session

Business rules:
  1. A user cannot start a new session if they already have one ACTIVE.
  2. Optionally links to a Task (must belong to the same user).
  3. Optionally specifies a planned duration in minutes.
  4. After persisting, publishes a 'session_started' event to the WebSocket
     group so all connected clients are notified in real time.

DIP: depends on FocusSessionRepository + BlockedSiteRepository (interfaces)
     and FocusSessionEventPublisher (Protocol from application/events.py).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

from apps.core.application.events import FocusSessionEventPublisher
from apps.core.domain.entities import FocusSession, SessionStatus, TaskId, UserId
from apps.core.domain.exceptions import SessionAlreadyActiveError, TaskNotFoundError
from apps.core.domain.repositories import (
    BlockedSiteRepository,
    FocusSessionRepository,
    TaskRepository,
)
from apps.core.domain.value_objects import DurationMinutes


@dataclass(frozen=True)
class StartFocusSessionInput:
    owner_id: UserId
    planned_duration_minutes: Optional[int] = None
    task_id: Optional[TaskId] = None


class StartFocusSessionUseCase:
    def __init__(
        self,
        session_repo: FocusSessionRepository,
        task_repo: TaskRepository,
        blocked_site_repo: BlockedSiteRepository,
        event_publisher: FocusSessionEventPublisher,
    ) -> None:
        self._session_repo = session_repo
        self._task_repo = task_repo
        self._blocked_site_repo = blocked_site_repo
        self._event_publisher = event_publisher

    def execute(self, data: StartFocusSessionInput) -> FocusSession:
        # Guard: no concurrent active sessions
        active = self._session_repo.get_active_for_user(data.owner_id)
        if active is not None:
            raise SessionAlreadyActiveError(data.owner_id)

        # Validate optional task link
        if data.task_id is not None:
            task = self._task_repo.get_by_id(data.task_id, data.owner_id)
            if task is None:
                raise TaskNotFoundError(data.task_id)

        # Validate optional duration
        duration_minutes: Optional[int] = None
        if data.planned_duration_minutes is not None:
            duration_minutes = DurationMinutes(data.planned_duration_minutes).value

        now = datetime.utcnow()
        session = FocusSession(
            id=0,
            owner_id=data.owner_id,
            started_at=now,
            status=SessionStatus.ACTIVE,
            planned_duration_minutes=duration_minutes,
            task_id=data.task_id,
        )
        saved_session = self._session_repo.save(session)

        # Notify all connected clients for this user
        blocked_domains = [
            site.domain
            for site in self._blocked_site_repo.list_for_user(
                data.owner_id, active_only=True
            )
        ]
        self._event_publisher.publish_session_started(
            self._build_payload(saved_session, blocked_domains)
        )

        return saved_session

    @staticmethod
    def _build_payload(session: FocusSession, blocked_domains: list[str]) -> dict[str, Any]:
        return {
            "type": "session_started",
            "session_id": session.id,
            "owner_id": session.owner_id,
            "started_at": session.started_at.isoformat(),
            "planned_duration_minutes": session.planned_duration_minutes,
            "ended_at": None,
            "blocked_domains": blocked_domains,
        }
