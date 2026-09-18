"""
Use Case: Update Task

Allows partial updates to title, description, priority, and due_date.
Status changes are handled by ToggleTaskStatusUseCase (SRP).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from apps.core.domain.entities import Priority, Task, TaskId, UserId
from apps.core.domain.exceptions import TaskNotFoundError
from apps.core.domain.repositories import TaskRepository


@dataclass(frozen=True)
class UpdateTaskInput:
    task_id: TaskId
    owner_id: UserId
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None


class UpdateTaskUseCase:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._repo = task_repo

    def execute(self, data: UpdateTaskInput) -> Task:
        task = self._repo.get_by_id(data.task_id, data.owner_id)
        if task is None:
            raise TaskNotFoundError(data.task_id)

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.priority is not None:
            task.priority = data.priority
        if data.due_date is not None:
            task.due_date = data.due_date

        return self._repo.save(task)
