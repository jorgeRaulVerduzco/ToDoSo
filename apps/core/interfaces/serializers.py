"""
DRF Serializers — input validation and output serialization.

Design:
  - Input serializers validate request data and are named *InputSerializer.
  - Output serializers shape domain entities for JSON responses.
  - Serializers do NOT touch the database or call use cases — that's
    the views' job.
  - Domain enums are surfaced as ChoiceFields to get OpenAPI enum docs.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.core.domain.entities import Priority, SessionStatus, TaskStatus


# ---------------------------------------------------------------------------
# Task serializers
# ---------------------------------------------------------------------------
class TaskOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    status = serializers.ChoiceField(choices=[s.value for s in TaskStatus])
    priority = serializers.ChoiceField(choices=[p.value for p in Priority])
    created_at = serializers.DateTimeField()
    due_date = serializers.DateTimeField(allow_null=True)
    owner_id = serializers.IntegerField()


class CreateTaskInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    priority = serializers.ChoiceField(
        choices=[p.value for p in Priority],
        default=Priority.MEDIUM.value,
    )
    due_date = serializers.DateTimeField(required=False, allow_null=True)


class UpdateTaskInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    priority = serializers.ChoiceField(
        choices=[p.value for p in Priority], required=False
    )
    due_date = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(
        choices=[s.value for s in TaskStatus], required=False
    )


# ---------------------------------------------------------------------------
# BlockedSite serializers
# ---------------------------------------------------------------------------
class BlockedSiteOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    domain = serializers.CharField()
    is_active = serializers.BooleanField()
    owner_id = serializers.IntegerField()


class AddBlockedSiteInputSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=253)


class ToggleBlockedSiteInputSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


# ---------------------------------------------------------------------------
# FocusSession serializers
# ---------------------------------------------------------------------------
class FocusSessionOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    owner_id = serializers.IntegerField()
    started_at = serializers.DateTimeField()
    planned_duration_minutes = serializers.IntegerField(allow_null=True)
    ended_at = serializers.DateTimeField(allow_null=True)
    status = serializers.ChoiceField(choices=[s.value for s in SessionStatus])
    task_id = serializers.IntegerField(allow_null=True)


class StartFocusSessionInputSerializer(serializers.Serializer):
    planned_duration_minutes = serializers.IntegerField(
        required=False, allow_null=True, min_value=1, max_value=1440
    )
    task_id = serializers.IntegerField(required=False, allow_null=True)


class FocusStateSnapshotSerializer(serializers.Serializer):
    has_active_session = serializers.BooleanField()
    session = FocusSessionOutputSerializer(allow_null=True)
    blocked_domains = serializers.ListField(child=serializers.CharField())


class SessionStatsSerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    cancelled_sessions = serializers.IntegerField()
    total_focus_minutes = serializers.IntegerField()
