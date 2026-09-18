"""
Dependency Injection wiring — manual factory functions.

This is the ONLY file in the interfaces layer that imports from
infrastructure. All views call a factory from here to get pre-assembled
use cases.

Pattern:
  def get_<use_case_name>() -> <UseCaseClass>:
      repo = ConcreteRepo()
      return UseCaseClass(repo)

Why not use a DI container?
  Manual DI is explicit, easy to trace, and has zero runtime magic.
  If the project grows, this file is the single place to swap implementations.
"""

from __future__ import annotations

from apps.core.application.use_cases.add_blocked_site import AddBlockedSiteUseCase
from apps.core.application.use_cases.create_task import CreateTaskUseCase
from apps.core.application.use_cases.delete_task import DeleteTaskUseCase
from apps.core.application.use_cases.get_active_session import GetActiveSessionUseCase
from apps.core.application.use_cases.get_session_stats import GetSessionStatsUseCase
from apps.core.application.use_cases.list_blocked_sites import ListBlockedSitesUseCase
from apps.core.application.use_cases.list_session_history import ListSessionHistoryUseCase
from apps.core.application.use_cases.list_tasks import ListTasksUseCase
from apps.core.application.use_cases.remove_blocked_site import RemoveBlockedSiteUseCase
from apps.core.application.use_cases.start_focus_session import StartFocusSessionUseCase
from apps.core.application.use_cases.stop_focus_session import StopFocusSessionUseCase
from apps.core.application.use_cases.toggle_blocked_site import ToggleBlockedSiteUseCase
from apps.core.application.use_cases.toggle_task_status import ToggleTaskStatusUseCase
from apps.core.application.use_cases.update_task import UpdateTaskUseCase
from apps.core.infrastructure.channel_event_publisher import ChannelLayerEventPublisher
from apps.core.infrastructure.repositories import (
    DjangoBlockedSiteRepository,
    DjangoFocusSessionRepository,
    DjangoTaskRepository,
)


# ---------------------------------------------------------------------------
# Task use cases
# ---------------------------------------------------------------------------
def get_create_task_use_case() -> CreateTaskUseCase:
    return CreateTaskUseCase(task_repo=DjangoTaskRepository())


def get_update_task_use_case() -> UpdateTaskUseCase:
    return UpdateTaskUseCase(task_repo=DjangoTaskRepository())


def get_delete_task_use_case() -> DeleteTaskUseCase:
    return DeleteTaskUseCase(task_repo=DjangoTaskRepository())


def get_toggle_task_status_use_case() -> ToggleTaskStatusUseCase:
    return ToggleTaskStatusUseCase(task_repo=DjangoTaskRepository())


def get_list_tasks_use_case() -> ListTasksUseCase:
    return ListTasksUseCase(task_repo=DjangoTaskRepository())


# ---------------------------------------------------------------------------
# Blocked site use cases
# ---------------------------------------------------------------------------
def get_add_blocked_site_use_case() -> AddBlockedSiteUseCase:
    return AddBlockedSiteUseCase(blocked_site_repo=DjangoBlockedSiteRepository())


def get_remove_blocked_site_use_case() -> RemoveBlockedSiteUseCase:
    return RemoveBlockedSiteUseCase(blocked_site_repo=DjangoBlockedSiteRepository())


def get_toggle_blocked_site_use_case() -> ToggleBlockedSiteUseCase:
    return ToggleBlockedSiteUseCase(blocked_site_repo=DjangoBlockedSiteRepository())


def get_list_blocked_sites_use_case() -> ListBlockedSitesUseCase:
    return ListBlockedSitesUseCase(blocked_site_repo=DjangoBlockedSiteRepository())


# ---------------------------------------------------------------------------
# Focus session use cases
# ---------------------------------------------------------------------------
def _make_publisher() -> ChannelLayerEventPublisher:
    return ChannelLayerEventPublisher()


def get_start_focus_session_use_case() -> StartFocusSessionUseCase:
    return StartFocusSessionUseCase(
        session_repo=DjangoFocusSessionRepository(),
        task_repo=DjangoTaskRepository(),
        blocked_site_repo=DjangoBlockedSiteRepository(),
        event_publisher=_make_publisher(),
    )


def get_stop_focus_session_use_case() -> StopFocusSessionUseCase:
    return StopFocusSessionUseCase(
        session_repo=DjangoFocusSessionRepository(),
        event_publisher=_make_publisher(),
    )


def get_active_session_use_case() -> GetActiveSessionUseCase:
    return GetActiveSessionUseCase(
        session_repo=DjangoFocusSessionRepository(),
        blocked_site_repo=DjangoBlockedSiteRepository(),
        event_publisher=_make_publisher(),
    )


def get_list_session_history_use_case() -> ListSessionHistoryUseCase:
    return ListSessionHistoryUseCase(session_repo=DjangoFocusSessionRepository())


def get_session_stats_use_case() -> GetSessionStatsUseCase:
    return GetSessionStatsUseCase(session_repo=DjangoFocusSessionRepository())
