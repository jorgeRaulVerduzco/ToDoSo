"""
Concrete repository implementations — Django ORM.

Each class implements the corresponding domain repository Protocol.
They depend on ORM models + mappers, and are the only place where
Django QuerySets appear.

LSP: these classes can be swapped for any other implementation (e.g.,
in-memory for tests) without breaking the use cases, as long as they
satisfy the Protocol's structural signature.
"""

from __future__ import annotations

from typing import Optional

from apps.core.domain.entities import (
    BlockedSite,
    BlockedSiteId,
    FocusSession,
    FocusSessionId,
    Priority,
    SessionStatus,
    Task,
    TaskId,
    TaskStatus,
    UserId,
)
from apps.core.domain.exceptions import (
    BlockedSiteNotFoundError,
    TaskNotFoundError,
)
from apps.core.infrastructure.mappers import (
    session_entity_to_model_fields,
    session_model_to_entity,
    site_entity_to_model_fields,
    site_model_to_entity,
    task_entity_to_model_fields,
    task_model_to_entity,
)
from apps.core.infrastructure.models import (
    BlockedSiteModel,
    FocusSessionModel,
    TaskModel,
)


class DjangoTaskRepository:
    """Concrete TaskRepository backed by Django ORM."""

    def get_by_id(self, task_id: TaskId, owner_id: UserId) -> Optional[Task]:
        try:
            model = TaskModel.objects.get(pk=task_id, owner_id=owner_id)
            return task_model_to_entity(model)
        except TaskModel.DoesNotExist:
            return None

    def list_for_user(
        self,
        owner_id: UserId,
        *,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
    ) -> list[Task]:
        qs = TaskModel.objects.filter(owner_id=owner_id)
        if status is not None:
            qs = qs.filter(status=status.value)
        if priority is not None:
            qs = qs.filter(priority=priority.value)
        return [task_model_to_entity(m) for m in qs]

    def save(self, task: Task) -> Task:
        fields = task_entity_to_model_fields(task)
        if task.id == 0:
            # New task — created_at is set by auto_now_add
            model = TaskModel.objects.create(**fields)
        else:
            TaskModel.objects.filter(pk=task.id).update(**fields)
            model = TaskModel.objects.get(pk=task.id)
        return task_model_to_entity(model)

    def delete(self, task_id: TaskId, owner_id: UserId) -> None:
        deleted, _ = TaskModel.objects.filter(pk=task_id, owner_id=owner_id).delete()
        if deleted == 0:
            raise TaskNotFoundError(task_id)


class DjangoFocusSessionRepository:
    """Concrete FocusSessionRepository backed by Django ORM."""

    def get_by_id(
        self, session_id: FocusSessionId, owner_id: UserId
    ) -> Optional[FocusSession]:
        try:
            model = FocusSessionModel.objects.get(pk=session_id, owner_id=owner_id)
            return session_model_to_entity(model)
        except FocusSessionModel.DoesNotExist:
            return None

    def get_active_for_user(self, owner_id: UserId) -> Optional[FocusSession]:
        try:
            model = FocusSessionModel.objects.get(
                owner_id=owner_id, status=SessionStatus.ACTIVE.value
            )
            return session_model_to_entity(model)
        except FocusSessionModel.DoesNotExist:
            return None

    def list_for_user(
        self,
        owner_id: UserId,
        *,
        status: Optional[SessionStatus] = None,
    ) -> list[FocusSession]:
        qs = FocusSessionModel.objects.filter(owner_id=owner_id)
        if status is not None:
            qs = qs.filter(status=status.value)
        return [session_model_to_entity(m) for m in qs]

    def save(self, session: FocusSession) -> FocusSession:
        fields = session_entity_to_model_fields(session)
        if session.id == 0:
            model = FocusSessionModel.objects.create(**fields)
        else:
            FocusSessionModel.objects.filter(pk=session.id).update(**fields)
            model = FocusSessionModel.objects.get(pk=session.id)
        return session_model_to_entity(model)


class DjangoBlockedSiteRepository:
    """Concrete BlockedSiteRepository backed by Django ORM."""

    def get_by_id(
        self, site_id: BlockedSiteId, owner_id: UserId
    ) -> Optional[BlockedSite]:
        try:
            model = BlockedSiteModel.objects.get(pk=site_id, owner_id=owner_id)
            return site_model_to_entity(model)
        except BlockedSiteModel.DoesNotExist:
            return None

    def get_by_domain(self, domain: str, owner_id: UserId) -> Optional[BlockedSite]:
        try:
            model = BlockedSiteModel.objects.get(domain=domain, owner_id=owner_id)
            return site_model_to_entity(model)
        except BlockedSiteModel.DoesNotExist:
            return None

    def list_for_user(
        self, owner_id: UserId, *, active_only: bool = False
    ) -> list[BlockedSite]:
        qs = BlockedSiteModel.objects.filter(owner_id=owner_id)
        if active_only:
            qs = qs.filter(is_active=True)
        return [site_model_to_entity(m) for m in qs]

    def save(self, site: BlockedSite) -> BlockedSite:
        fields = site_entity_to_model_fields(site)
        if site.id == 0:
            model = BlockedSiteModel.objects.create(**fields)
        else:
            BlockedSiteModel.objects.filter(pk=site.id).update(**fields)
            model = BlockedSiteModel.objects.get(pk=site.id)
        return site_model_to_entity(model)

    def delete(self, site_id: BlockedSiteId, owner_id: UserId) -> None:
        deleted, _ = BlockedSiteModel.objects.filter(
            pk=site_id, owner_id=owner_id
        ).delete()
        if deleted == 0:
            raise BlockedSiteNotFoundError(site_id)
