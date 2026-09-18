"""
Root URL configuration.

URL structure:
  /api/auth/          — JWT login & refresh (no auth required)
  /api/tasks/         — Task CRUD
  /api/blocked-sites/ — BlockedSite CRUD
  /api/focus-sessions/— FocusSession endpoints
  /api/schema/        — OpenAPI schema (JSON/YAML)
  /api/docs/          — Swagger UI
  /api/redoc/         — ReDoc UI
  /admin/             — Django admin
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # Auth
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Core API
    path("api/", include("apps.core.interfaces.urls")),
    # OpenAPI / docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
