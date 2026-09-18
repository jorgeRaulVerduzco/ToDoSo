"""
Use Case: List Tasks

Returns tasks for the requesting user, with optional filters.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from apps.core.domain.entities import Priority, Task, TaskStatus, UserId
from apps.core.domain.repositories import TaskRepository


@dataclass(frozen=True)
class ListTasksInput:
    owner_id: UserId
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None


class ListTasksUseCase:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._repo = task_repo

    def execute(self, data: ListTasksInput) -> list[Task]:
        return self._repo.list_for_user(
            data.owner_id,
            status=data.status,
            priority=data.priority,
        )
