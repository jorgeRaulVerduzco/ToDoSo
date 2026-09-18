"""
Use Case: Create Task

SRP: this class does exactly one thing — validate input and persist a new task.
DIP: depends on TaskRepository (interface), not the ORM.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from apps.core.domain.entities import Priority, Task, TaskStatus, UserId
from apps.core.domain.repositories import TaskRepository


@dataclass(frozen=True)
class CreateTaskInput:
    owner_id: UserId
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None


class CreateTaskUseCase:
    """Creates a new Task for the given owner."""

    def __init__(self, task_repo: TaskRepository) -> None:
        self._repo = task_repo

    def execute(self, data: CreateTaskInput) -> Task:
        now = datetime.utcnow()
        # id=0 signals the repo to auto-assign a real ID on save
        task = Task(
            id=0,
            owner_id=data.owner_id,
            title=data.title,
            description=data.description,
            status=TaskStatus.PENDING,
            priority=data.priority,
            created_at=now,
            due_date=data.due_date,
        )
        return self._repo.save(task)
