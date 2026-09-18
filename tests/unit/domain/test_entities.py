"""
Unit tests for domain entities.

No database, no Django. Pure Python.
"""

import pytest
from datetime import datetime

from apps.core.domain.entities import (
    FocusSession,
    Priority,
    SessionStatus,
    Task,
    TaskStatus,
)


class TestTask:
    def _make_task(self, status: TaskStatus = TaskStatus.PENDING) -> Task:
        return Task(
            id=1,
            owner_id=42,
            title="Write tests",
            status=status,
            priority=Priority.MEDIUM,
            created_at=datetime.utcnow(),
        )

    def test_complete_sets_status(self):
        task = self._make_task()
        task.complete()
        assert task.status == TaskStatus.COMPLETED

    def test_complete_is_idempotent(self):
        task = self._make_task(TaskStatus.COMPLETED)
        task.complete()  # should not raise
        assert task.status == TaskStatus.COMPLETED

    def test_reopen_sets_status(self):
        task = self._make_task(TaskStatus.COMPLETED)
        task.reopen()
        assert task.status == TaskStatus.PENDING


class TestFocusSession:
    def _make_session(self, status: SessionStatus = SessionStatus.ACTIVE) -> FocusSession:
        return FocusSession(
            id=1,
            owner_id=42,
            started_at=datetime(2024, 1, 1, 10, 0, 0),
            status=status,
        )

    def test_finish_active_session(self):
        session = self._make_session()
        ended = datetime(2024, 1, 1, 11, 0, 0)
        session.finish(ended)
        assert session.status == SessionStatus.FINISHED
        assert session.ended_at == ended

    def test_finish_already_finished_raises(self):
        session = self._make_session(SessionStatus.FINISHED)
        with pytest.raises(ValueError, match="finished"):
            session.finish(datetime.utcnow())

    def test_cancel_active_session(self):
        session = self._make_session()
        ended = datetime(2024, 1, 1, 10, 30, 0)
        session.cancel(ended)
        assert session.status == SessionStatus.CANCELLED
        assert session.ended_at == ended

    def test_is_active_property(self):
        active = self._make_session(SessionStatus.ACTIVE)
        finished = self._make_session(SessionStatus.FINISHED)
        assert active.is_active is True
        assert finished.is_active is False
