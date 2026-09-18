"""
Unit tests for CreateTaskUseCase.

Uses an in-memory repository stub — no DB required.
"""

from __future__ import annotations

import pytest
from datetime import datetime
from typing import Optional
from unittest.mock import MagicMock

from apps.core.application.use_cases.create_task import CreateTaskInput, CreateTaskUseCase
from apps.core.domain.entities import Priority, Task, TaskStatus


class InMemoryTaskRepo:
    """Minimal in-memory stub satisfying TaskRepository protocol."""

    def __init__(self):
        self._store: dict[int, Task] = {}
        self._next_id = 1

    def get_by_id(self, task_id, owner_id):
        return self._store.get(task_id)

    def list_for_user(self, owner_id, *, status=None, priority=None):
        return [t for t in self._store.values() if t.owner_id == owner_id]

    def save(self, task):
        if task.id == 0:
            task.id = self._next_id
            self._next_id += 1
        self._store[task.id] = task
        return task

    def delete(self, task_id, owner_id):
        self._store.pop(task_id, None)


class TestCreateTaskUseCase:
    def setup_method(self):
        self.repo = InMemoryTaskRepo()
        self.use_case = CreateTaskUseCase(task_repo=self.repo)

    def test_creates_task_with_defaults(self):
        task = self.use_case.execute(
            CreateTaskInput(owner_id=1, title="Buy milk")
        )
        assert task.id != 0
        assert task.title == "Buy milk"
        assert task.status == TaskStatus.PENDING
        assert task.priority == Priority.MEDIUM
        assert task.description is None
        assert task.due_date is None
        assert task.owner_id == 1

    def test_creates_task_with_all_fields(self):
        due = datetime(2025, 12, 31)
        task = self.use_case.execute(
            CreateTaskInput(
                owner_id=1,
                title="Submit report",
                description="Annual report",
                priority=Priority.HIGH,
                due_date=due,
            )
        )
        assert task.priority == Priority.HIGH
        assert task.description == "Annual report"
        assert task.due_date == due

    def test_task_is_persisted(self):
        self.use_case.execute(CreateTaskInput(owner_id=1, title="Task A"))
        tasks = self.repo.list_for_user(1)
        assert len(tasks) == 1
        assert tasks[0].title == "Task A"
