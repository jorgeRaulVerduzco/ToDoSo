"""
Unit tests for StopFocusSessionUseCase.
"""

from __future__ import annotations

import pytest
from datetime import datetime
from unittest.mock import MagicMock

from apps.core.application.use_cases.stop_focus_session import StopFocusSessionUseCase
from apps.core.domain.entities import FocusSession, SessionStatus
from apps.core.domain.exceptions import SessionNotActiveError, SessionNotFoundError


class TestStopFocusSessionUseCase:
    def _make_uc(self, session: FocusSession | None):
        session_repo = MagicMock()
        event_publisher = MagicMock()
        session_repo.get_by_id.return_value = session
        session_repo.save.side_effect = lambda s: s
        return StopFocusSessionUseCase(session_repo, event_publisher), event_publisher

    def _active_session(self) -> FocusSession:
        return FocusSession(
            id=1, owner_id=5, started_at=datetime(2024, 1, 1, 10, 0), status=SessionStatus.ACTIVE
        )

    def test_stops_active_session(self):
        uc, publisher = self._make_uc(self._active_session())
        result = uc.execute(session_id=1, owner_id=5)
        assert result.status == SessionStatus.FINISHED
        assert result.ended_at is not None
        publisher.publish_session_stopped.assert_called_once()

    def test_raises_not_found_when_missing(self):
        uc, _ = self._make_uc(None)
        with pytest.raises(SessionNotFoundError):
            uc.execute(session_id=99, owner_id=5)

    def test_raises_not_active_when_finished(self):
        finished = FocusSession(
            id=1,
            owner_id=5,
            started_at=datetime(2024, 1, 1),
            status=SessionStatus.FINISHED,
            ended_at=datetime(2024, 1, 1, 11, 0),
        )
        uc, _ = self._make_uc(finished)
        with pytest.raises(SessionNotActiveError):
            uc.execute(session_id=1, owner_id=5)
