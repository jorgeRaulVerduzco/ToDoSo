"""
Repository Interfaces — Protocol-based contracts for the domain.

Design principles (SOLID):
  - ISP: each Protocol is small and focused. Larger repos compose smaller ones.
  - DIP: application use cases import these interfaces, never the concrete
         Django ORM implementations.
  - LSP: any object that satisfies a Protocol's structural signature can be
         used as a drop-in replacement.

No Django imports here — these are pure Python typing constructs.
"""

from __future__ import annotations

from typing import Optional, Protocol, runtime_checkable

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


# ---------------------------------------------------------------------------
# Task repository (ISP: split into read + write interfaces)
# ---------------------------------------------------------------------------
@runtime_checkable
class TaskReader(Protocol):
    def get_by_id(self, task_id: TaskId, owner_id: UserId) -> Optional[Task]:
        """Return a Task or None if not found / not owned by owner_id."""
        ...

    def list_for_user(
        self,
        owner_id: UserId,
        *,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
    ) -> list[Task]:
        """Return all tasks for owner_id, optionally filtered."""
        ...


@runtime_checkable
class TaskWriter(Protocol):
    def save(self, task: Task) -> Task:
        """Persist a new or updated Task. Returns the saved entity."""
        ...

    def delete(self, task_id: TaskId, owner_id: UserId) -> None:
        """Delete a task. Raises TaskNotFoundError if not found."""
        ...


class TaskRepository(TaskReader, TaskWriter, Protocol):
    """Combined Task repository used by most use cases."""


# ---------------------------------------------------------------------------
# FocusSession repository
# ---------------------------------------------------------------------------
@runtime_checkable
class FocusSessionReader(Protocol):
    def get_by_id(
        self, session_id: FocusSessionId, owner_id: UserId
    ) -> Optional[FocusSession]:
        ...

    def get_active_for_user(self, owner_id: UserId) -> Optional[FocusSession]:
        """Return the currently ACTIVE session for owner_id, or None."""
        ...

    def list_for_user(
        self,
        owner_id: UserId,
        *,
        status: Optional[SessionStatus] = None,
    ) -> list[FocusSession]:
        ...


@runtime_checkable
class FocusSessionWriter(Protocol):
    def save(self, session: FocusSession) -> FocusSession:
        ...


class FocusSessionRepository(FocusSessionReader, FocusSessionWriter, Protocol):
    """Combined FocusSession repository."""


# ---------------------------------------------------------------------------
# BlockedSite repository
# ---------------------------------------------------------------------------
@runtime_checkable
class BlockedSiteReader(Protocol):
    def get_by_id(
        self, site_id: BlockedSiteId, owner_id: UserId
    ) -> Optional[BlockedSite]:
        ...

    def get_by_domain(self, domain: str, owner_id: UserId) -> Optional[BlockedSite]:
        ...

    def list_for_user(
        self, owner_id: UserId, *, active_only: bool = False
    ) -> list[BlockedSite]:
        ...


@runtime_checkable
class BlockedSiteWriter(Protocol):
    def save(self, site: BlockedSite) -> BlockedSite:
        ...

    def delete(self, site_id: BlockedSiteId, owner_id: UserId) -> None:
        ...


class BlockedSiteRepository(BlockedSiteReader, BlockedSiteWriter, Protocol):
    """Combined BlockedSite repository."""
