"""
Use Case: Delete Task

Deletes a task owned by the requesting user.
TaskNotFoundError is raised (and mapped to 404 in the interfaces layer)
if the task doesn't exist or belongs to another user.
"""

from __future__ import annotations

from apps.core.domain.entities import TaskId, UserId
from apps.core.domain.exceptions import TaskNotFoundError
from apps.core.domain.repositories import TaskRepository


class DeleteTaskUseCase:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._repo = task_repo

    def execute(self, task_id: TaskId, owner_id: UserId) -> None:
        task = self._repo.get_by_id(task_id, owner_id)
        if task is None:
            raise TaskNotFoundError(task_id)
        self._repo.delete(task_id, owner_id)
