"""
Use Case: Toggle Task Status

Flips a Task between PENDING and COMPLETED (or explicitly sets it).
Keeps status-change logic in one place (SRP).
"""

from __future__ import annotations

from apps.core.domain.entities import Task, TaskId, TaskStatus, UserId
from apps.core.domain.exceptions import TaskNotFoundError
from apps.core.domain.repositories import TaskRepository


class ToggleTaskStatusUseCase:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._repo = task_repo

    def execute(self, task_id: TaskId, owner_id: UserId, target_status: TaskStatus) -> Task:
        task = self._repo.get_by_id(task_id, owner_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        if target_status == TaskStatus.COMPLETED:
            task.complete()
        else:
            task.reopen()

        return self._repo.save(task)
