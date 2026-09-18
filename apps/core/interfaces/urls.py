"""
App-level URL configuration.

These are mounted under /api/ in config/urls.py.

REST endpoints:
  GET    /api/tasks/                        → list tasks
  POST   /api/tasks/                        → create task
  PATCH  /api/tasks/<id>/                   → update task
  DELETE /api/tasks/<id>/                   → delete task

  GET    /api/blocked-sites/                → list blocked sites
  POST   /api/blocked-sites/                → add blocked site
  PATCH  /api/blocked-sites/<id>/           → toggle active
  DELETE /api/blocked-sites/<id>/           → remove blocked site

  POST   /api/focus-sessions/start/         → start session
  POST   /api/focus-sessions/<id>/stop/     → stop session
  GET    /api/focus-sessions/active/        → get active session snapshot
  GET    /api/focus-sessions/history/       → session history
  GET    /api/focus-sessions/stats/         → aggregate stats

WebSocket:
  WS     /ws/focus-sessions/               → real-time session events
  (defined in config/routing.py)
"""

from django.urls import path

from apps.core.interfaces.views import (
    BlockedSiteDetailView,
    BlockedSiteListCreateView,
    FocusSessionActiveView,
    FocusSessionHistoryView,
    FocusSessionStartView,
    FocusSessionStatsView,
    FocusSessionStopView,
    TaskDetailView,
    TaskListCreateView,
)

urlpatterns = [
    # Tasks
    path("tasks/", TaskListCreateView.as_view(), name="task-list-create"),
    path("tasks/<int:task_id>/", TaskDetailView.as_view(), name="task-detail"),
    # Blocked sites
    path("blocked-sites/", BlockedSiteListCreateView.as_view(), name="blocked-site-list-create"),
    path("blocked-sites/<int:site_id>/", BlockedSiteDetailView.as_view(), name="blocked-site-detail"),
    # Focus sessions — specific routes before parameterised ones
    path("focus-sessions/start/", FocusSessionStartView.as_view(), name="focus-session-start"),
    path("focus-sessions/active/", FocusSessionActiveView.as_view(), name="focus-session-active"),
    path("focus-sessions/history/", FocusSessionHistoryView.as_view(), name="focus-session-history"),
    path("focus-sessions/stats/", FocusSessionStatsView.as_view(), name="focus-session-stats"),
    path("focus-sessions/<int:session_id>/stop/", FocusSessionStopView.as_view(), name="focus-session-stop"),
]
