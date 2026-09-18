"""
Mappers — ORM model ↔ domain entity converters.

These functions are the only place that knows about both layers.
They live in infrastructure because they depend on ORM models.

Keeping them separate from the repository keeps repositories readable
and makes the boundary between infrastructure and domain explicit.
"""

from __future__ import annotations

from apps.core.domain.entities import (
    BlockedSite,
    FocusSession,
    Priority,
    SessionStatus,
    Task,
    TaskStatus,
)
from apps.core.infrastructure.models import (
    BlockedSiteModel,
    FocusSessionModel,
    TaskModel,
)


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------
def task_model_to_entity(model: TaskModel) -> Task:
    return Task(
        id=model.pk,
        owner_id=model.owner_id,
        title=model.title,
        description=model.description,
        status=TaskStatus(model.status),
        priority=Priority(model.priority),
        created_at=model.created_at,
        due_date=model.due_date,
    )


def task_entity_to_model_fields(entity: Task) -> dict:
    """Returns a dict suitable for TaskModel(**fields) or model.update(**fields)."""
    return {
        "owner_id": entity.owner_id,
        "title": entity.title,
        "description": entity.description,
        "status": entity.status.value,
        "priority": entity.priority.value,
        "due_date": entity.due_date,
    }


# ---------------------------------------------------------------------------
# FocusSession
# ---------------------------------------------------------------------------
def session_model_to_entity(model: FocusSessionModel) -> FocusSession:
    return FocusSession(
        id=model.pk,
        owner_id=model.owner_id,
        started_at=model.started_at,
        status=SessionStatus(model.status),
        planned_duration_minutes=model.planned_duration_minutes,
        ended_at=model.ended_at,
        task_id=model.task_id,
    )


def session_entity_to_model_fields(entity: FocusSession) -> dict:
    return {
        "owner_id": entity.owner_id,
        "started_at": entity.started_at,
        "status": entity.status.value,
        "planned_duration_minutes": entity.planned_duration_minutes,
        "ended_at": entity.ended_at,
        "task_id": entity.task_id,
    }


# ---------------------------------------------------------------------------
# BlockedSite
# ---------------------------------------------------------------------------
def site_model_to_entity(model: BlockedSiteModel) -> BlockedSite:
    return BlockedSite(
        id=model.pk,
        owner_id=model.owner_id,
        domain=model.domain,
        is_active=model.is_active,
    )


def site_entity_to_model_fields(entity: BlockedSite) -> dict:
    return {
        "owner_id": entity.owner_id,
        "domain": entity.domain,
        "is_active": entity.is_active,
    }
