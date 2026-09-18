"""
Django ORM models — infrastructure layer.

These models are the persistence representation. They are NOT the domain
entities. Conversion between ORM models and domain entities is handled by
mappers.py in this same package.

Design notes:
  - TaskModel, FocusSessionModel, BlockedSiteModel all use
    owner = ForeignKey(settings.AUTH_USER_MODEL) for user isolation.
  - String choices are defined as TextChoices to get both DB storage
    efficiency and Python-level validation.
  - All timestamps are stored in UTC (USE_TZ=True).
"""

from django.conf import settings
from django.db import models


class TaskModel(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "core"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Task({self.id}, {self.title!r}, {self.status})"


class FocusSessionModel(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        FINISHED = "finished", "Finished"
        CANCELLED = "cancelled", "Cancelled"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="focus_sessions",
    )
    started_at = models.DateTimeField()
    planned_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    task = models.ForeignKey(
        TaskModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="focus_sessions",
    )

    class Meta:
        app_label = "core"
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"FocusSession({self.id}, user={self.owner_id}, {self.status})"


class BlockedSiteModel(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocked_sites",
    )
    domain = models.CharField(max_length=253)  # max valid domain length
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = "core"
        # Enforce uniqueness: a user can't add the same domain twice
        unique_together = [("owner", "domain")]
        ordering = ["domain"]

    def __str__(self) -> str:
        return f"BlockedSite({self.id}, {self.domain}, active={self.is_active})"
