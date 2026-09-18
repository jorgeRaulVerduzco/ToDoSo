"""
Unit tests for StartFocusSessionUseCase.

Key business rule tested: only one active session per user.
Uses stubs/mocks — no DB required.
"""

from __future__ import annotations

import pytest
from datetime import datetime
from unittest.mock import MagicMock

from apps.core.application.use_cases.start_focus_session import (
    StartFocusSessionInput,
    StartFocusSessionUseCase,
)
from apps.core.domain.entities import FocusSession, SessionStatus
from apps.core.domain.exceptions import SessionAlreadyActiveError


def _make_active_session(owner_id: int) -> FocusSession:
    return FocusSession(
        id=1,
        owner_id=owner_id,
        started_at=datetime.utcnow(),
        status=SessionStatus.ACTIVE,
    )


class TestStartFocusSessionUseCase:
    def _make_use_case(
        self,
        active_session=None,
        task_exists=True,
    ):
        session_repo = MagicMock()
        task_repo = MagicMock()
        blocked_site_repo = MagicMock()
        event_publisher = MagicMock()

        session_repo.get_active_for_user.return_value = active_session
        session_repo.save.side_effect = lambda s: s

        task_repo.get_by_id.return_value = MagicMock() if task_exists else None
        blocked_site_repo.list_for_user.return_value = []

        uc = StartFocusSessionUseCase(
            session_repo=session_repo,
            task_repo=task_repo,
            blocked_site_repo=blocked_site_repo,
            event_publisher=event_publisher,
        )
        return uc, session_repo, task_repo, event_publisher

    def test_starts_session_when_none_active(self):
        uc, session_repo, _, publisher = self._make_use_case(active_session=None)
        uc.execute(StartFocusSessionInput(owner_id=1))
        session_repo.save.assert_called_once()
        publisher.publish_session_started.assert_called_once()

    def test_raises_when_session_already_active(self):
        active = _make_active_session(owner_id=1)
        uc, _, _, _ = self._make_use_case(active_session=active)

        with pytest.raises(SessionAlreadyActiveError):
            uc.execute(StartFocusSessionInput(owner_id=1))

    def test_does_not_publish_when_already_active(self):
        active = _make_active_session(owner_id=1)
        uc, _, _, publisher = self._make_use_case(active_session=active)

        with pytest.raises(SessionAlreadyActiveError):
            uc.execute(StartFocusSessionInput(owner_id=1))

        publisher.publish_session_started.assert_not_called()

    def test_validates_duration_minutes(self):
        uc, _, _, _ = self._make_use_case()
        with pytest.raises(ValueError):
            uc.execute(
                StartFocusSessionInput(owner_id=1, planned_duration_minutes=0)
            )

    def test_session_has_correct_owner(self):
        uc, session_repo, _, _ = self._make_use_case()
        session_repo.save.side_effect = lambda s: FocusSession(
            id=99, owner_id=s.owner_id, started_at=s.started_at, status=s.status
        )
        result = uc.execute(StartFocusSessionInput(owner_id=7))
        assert result.owner_id == 7
