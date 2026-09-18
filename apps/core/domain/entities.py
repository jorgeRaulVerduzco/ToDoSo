"""
Domain Entities — pure Python dataclasses.

Rules:
  - ZERO imports from Django, DRF, or any framework.
  - These are the canonical data shapes understood by all use cases.
  - UserId is a plain int alias so the domain never touches Django's User model.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Primitive type aliases
# ---------------------------------------------------------------------------
UserId = int
TaskId = int
FocusSessionId = int
BlockedSiteId = int


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------
class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    FINISHED = "finished"
    CANCELLED = "cancelled"


# ---------------------------------------------------------------------------
# Entities
# ---------------------------------------------------------------------------
@dataclass
class Task:
    """A single to-do item owned by a user."""

    id: TaskId
    owner_id: UserId
    title: str
    status: TaskStatus
    priority: Priority
    created_at: datetime
    description: Optional[str] = None
    due_date: Optional[datetime] = None

    def complete(self) -> None:
        """Mark this task as completed (business rule: idempotent)."""
        self.status = TaskStatus.COMPLETED

    def reopen(self) -> None:
        """Revert task to pending."""
        self.status = TaskStatus.PENDING


@dataclass
class FocusSession:
    """A timed concentration session for a user.

    Business rules enforced here (not in the ORM model):
      - A session can only be finished/cancelled if it is currently ACTIVE.
      - planned_duration_minutes is optional; if absent the session is open-ended.
    """

    id: FocusSessionId
    owner_id: UserId
    started_at: datetime
    status: SessionStatus
    planned_duration_minutes: Optional[int] = None
    ended_at: Optional[datetime] = None
    task_id: Optional[TaskId] = None

    def finish(self, ended_at: datetime) -> None:
        if self.status != SessionStatus.ACTIVE:
            raise ValueError(f"Cannot finish a session that is {self.status!r}.")
        self.status = SessionStatus.FINISHED
        self.ended_at = ended_at

    def cancel(self, ended_at: datetime) -> None:
        if self.status != SessionStatus.ACTIVE:
            raise ValueError(f"Cannot cancel a session that is {self.status!r}.")
        self.status = SessionStatus.CANCELLED
        self.ended_at = ended_at

    @property
    def is_active(self) -> bool:
        return self.status == SessionStatus.ACTIVE


@dataclass
class BlockedSite:
    """A domain entry in a user's block list.

    The site can be toggled (enabled/disabled) without being deleted,
    so users can temporarily lift blocks without losing their list.
    """

    id: BlockedSiteId
    owner_id: UserId
    domain: str          # e.g. "facebook.com" — validated by Domain value object
    is_active: bool = True


@dataclass
class FocusStateSnapshot:
    """
    Read-only projection sent to clients (REST + WebSocket).

    Contains everything a client needs to decide what to block right now.
    Not persisted — assembled by GetActiveSessionUseCase on every read.
    """

    has_active_session: bool
    session: Optional[FocusSession] = None
    blocked_domains: list[str] = field(default_factory=list)
