"""
DRF Views / ViewSets — the HTTP entry point.

Design contract:
  1. Views validate input (via serializers).
  2. Views call a use case obtained from dependencies.py (DI).
  3. Views serialize the domain entity returned by the use case.
  4. Views return a Response.
  5. Views contain ZERO business logic.

All views require JWT authentication (set globally in REST_FRAMEWORK settings).
Public endpoints (login/refresh) are in config/urls.py and bypass this.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.application.use_cases.create_task import CreateTaskInput
from apps.core.application.use_cases.get_active_session import GetActiveSessionUseCase
from apps.core.application.use_cases.list_blocked_sites import ListBlockedSitesInput
from apps.core.application.use_cases.list_session_history import ListSessionHistoryInput
from apps.core.application.use_cases.list_tasks import ListTasksInput
from apps.core.application.use_cases.start_focus_session import StartFocusSessionInput
from apps.core.application.use_cases.toggle_task_status import ToggleTaskStatusUseCase
from apps.core.application.use_cases.update_task import UpdateTaskInput
from apps.core.domain.entities import Priority, SessionStatus, TaskStatus
from apps.core.interfaces import dependencies as di
from apps.core.interfaces.serializers import (
    AddBlockedSiteInputSerializer,
    BlockedSiteOutputSerializer,
    CreateTaskInputSerializer,
    FocusSessionOutputSerializer,
    FocusStateSnapshotSerializer,
    SessionStatsSerializer,
    StartFocusSessionInputSerializer,
    ToggleBlockedSiteInputSerializer,
    UpdateTaskInputSerializer,
    TaskOutputSerializer,
)


def _serialize_task(task: Any) -> dict:
    return TaskOutputSerializer(task).data


def _serialize_session(session: Any) -> dict:
    return FocusSessionOutputSerializer(session).data


def _serialize_site(site: Any) -> dict:
    return BlockedSiteOutputSerializer(site).data


# ---------------------------------------------------------------------------
# Task views
# ---------------------------------------------------------------------------
@extend_schema(tags=["Tasks"])
class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List tasks",
        parameters=[
            OpenApiParameter("status", str, enum=[s.value for s in TaskStatus]),
            OpenApiParameter("priority", str, enum=[p.value for p in Priority]),
        ],
        responses={200: TaskOutputSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        use_case = di.get_list_tasks_use_case()
        status_filter = request.query_params.get("status")
        priority_filter = request.query_params.get("priority")
        data = ListTasksInput(
            owner_id=request.user.pk,
            status=TaskStatus(status_filter) if status_filter else None,
            priority=Priority(priority_filter) if priority_filter else None,
        )
        tasks = use_case.execute(data)
        return Response([_serialize_task(t) for t in tasks])

    @extend_schema(
        summary="Create task",
        request=CreateTaskInputSerializer,
        responses={201: TaskOutputSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = CreateTaskInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        use_case = di.get_create_task_use_case()
        task = use_case.execute(
            CreateTaskInput(
                owner_id=request.user.pk,
                title=vd["title"],
                description=vd.get("description"),
                priority=Priority(vd.get("priority", Priority.MEDIUM.value)),
                due_date=vd.get("due_date"),
            )
        )
        return Response(_serialize_task(task), status=status.HTTP_201_CREATED)


@extend_schema(tags=["Tasks"])
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update task (partial)",
        request=UpdateTaskInputSerializer,
        responses={200: TaskOutputSerializer},
    )
    def patch(self, request: Request, task_id: int) -> Response:
        serializer = UpdateTaskInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        # If status is being updated, route to toggle use case
        if "status" in vd:
            uc: ToggleTaskStatusUseCase = di.get_toggle_task_status_use_case()
            task = uc.execute(task_id, request.user.pk, TaskStatus(vd["status"]))
            # If there are other fields to update, continue below
            if len(vd) == 1:
                return Response(_serialize_task(task))

        use_case = di.get_update_task_use_case()
        task = use_case.execute(
            UpdateTaskInput(
                task_id=task_id,
                owner_id=request.user.pk,
                title=vd.get("title"),
                description=vd.get("description"),
                priority=Priority(vd["priority"]) if "priority" in vd else None,
                due_date=vd.get("due_date"),
            )
        )
        return Response(_serialize_task(task))

    @extend_schema(summary="Delete task", responses={204: None})
    def delete(self, request: Request, task_id: int) -> Response:
        use_case = di.get_delete_task_use_case()
        use_case.execute(task_id, request.user.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Blocked site views
# ---------------------------------------------------------------------------
@extend_schema(tags=["Blocked Sites"])
class BlockedSiteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List blocked sites",
        parameters=[OpenApiParameter("active_only", bool)],
        responses={200: BlockedSiteOutputSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        use_case = di.get_list_blocked_sites_use_case()
        sites = use_case.execute(
            ListBlockedSitesInput(owner_id=request.user.pk, active_only=active_only)
        )
        return Response([_serialize_site(s) for s in sites])

    @extend_schema(
        summary="Add blocked site",
        request=AddBlockedSiteInputSerializer,
        responses={201: BlockedSiteOutputSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = AddBlockedSiteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        use_case = di.get_add_blocked_site_use_case()
        from apps.core.application.use_cases.add_blocked_site import AddBlockedSiteInput
        site = use_case.execute(
            AddBlockedSiteInput(
                owner_id=request.user.pk,
                domain=serializer.validated_data["domain"],
            )
        )
        return Response(_serialize_site(site), status=status.HTTP_201_CREATED)


@extend_schema(tags=["Blocked Sites"])
class BlockedSiteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update blocked site (toggle active)",
        request=ToggleBlockedSiteInputSerializer,
        responses={200: BlockedSiteOutputSerializer},
    )
    def patch(self, request: Request, site_id: int) -> Response:
        serializer = ToggleBlockedSiteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        use_case = di.get_toggle_blocked_site_use_case()
        site = use_case.execute(
            site_id, request.user.pk, serializer.validated_data["is_active"]
        )
        return Response(_serialize_site(site))

    @extend_schema(summary="Delete blocked site", responses={204: None})
    def delete(self, request: Request, site_id: int) -> Response:
        use_case = di.get_remove_blocked_site_use_case()
        use_case.execute(site_id, request.user.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Focus session views
# ---------------------------------------------------------------------------
@extend_schema(tags=["Focus Sessions"])
class FocusSessionStartView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Start a focus session",
        request=StartFocusSessionInputSerializer,
        responses={201: FocusSessionOutputSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = StartFocusSessionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        use_case = di.get_start_focus_session_use_case()
        session = use_case.execute(
            StartFocusSessionInput(
                owner_id=request.user.pk,
                planned_duration_minutes=vd.get("planned_duration_minutes"),
                task_id=vd.get("task_id"),
            )
        )
        return Response(_serialize_session(session), status=status.HTTP_201_CREATED)


@extend_schema(tags=["Focus Sessions"])
class FocusSessionStopView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Stop a focus session",
        responses={200: FocusSessionOutputSerializer},
    )
    def post(self, request: Request, session_id: int) -> Response:
        use_case = di.get_stop_focus_session_use_case()
        session = use_case.execute(session_id, request.user.pk)
        return Response(_serialize_session(session))


@extend_schema(tags=["Focus Sessions"])
class FocusSessionActiveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get current active session state (REST snapshot for initial client load)",
        responses={200: FocusStateSnapshotSerializer},
    )
    def get(self, request: Request) -> Response:
        use_case = di.get_active_session_use_case()
        snapshot = use_case.execute(request.user.pk)
        return Response(FocusStateSnapshotSerializer(snapshot).data)


@extend_schema(tags=["Focus Sessions"])
class FocusSessionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List focus session history",
        parameters=[
            OpenApiParameter(
                "status", str, enum=[s.value for s in SessionStatus]
            )
        ],
        responses={200: FocusSessionOutputSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        status_filter = request.query_params.get("status")
        use_case = di.get_list_session_history_use_case()
        sessions = use_case.execute(
            ListSessionHistoryInput(
                owner_id=request.user.pk,
                status=SessionStatus(status_filter) if status_filter else None,
            )
        )
        return Response([_serialize_session(s) for s in sessions])


@extend_schema(tags=["Focus Sessions"])
class FocusSessionStatsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get focus session statistics",
        responses={200: SessionStatsSerializer},
    )
    def get(self, request: Request) -> Response:
        use_case = di.get_session_stats_use_case()
        stats = use_case.execute(request.user.pk)
        return Response(SessionStatsSerializer(stats).data)
