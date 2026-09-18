"""
Uniform error response handler for DRF.

All API errors — whether raised by DRF itself (validation, auth) or by
domain exceptions (TaskNotFoundError, SessionAlreadyActiveError, etc.) —
are returned in a consistent JSON envelope:

  {
    "error": {
      "code": "task_not_found",        // snake_case error code
      "message": "Task 42 not found."  // human-readable description
    }
  }

Domain exceptions are mapped here to avoid leaking infrastructure details
and to centralize HTTP status code decisions.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.core.domain.exceptions import (
    BlockedSiteNotFoundError,
    DomainError,
    SessionAlreadyActiveError,
    SessionNotActiveError,
    SessionNotFoundError,
    SiteAlreadyExistsError,
    TaskNotFoundError,
    UnauthorizedError,
)

# Map domain exception type → (HTTP status code, error code string)
_DOMAIN_EXCEPTION_MAP: dict[type[DomainError], tuple[int, str]] = {
    TaskNotFoundError: (status.HTTP_404_NOT_FOUND, "task_not_found"),
    SessionNotFoundError: (status.HTTP_404_NOT_FOUND, "session_not_found"),
    SessionAlreadyActiveError: (status.HTTP_409_CONFLICT, "session_already_active"),
    SessionNotActiveError: (status.HTTP_409_CONFLICT, "session_not_active"),
    BlockedSiteNotFoundError: (status.HTTP_404_NOT_FOUND, "blocked_site_not_found"),
    SiteAlreadyExistsError: (status.HTTP_409_CONFLICT, "site_already_exists"),
    UnauthorizedError: (status.HTTP_403_FORBIDDEN, "forbidden"),
}


def _make_error(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    # Let DRF handle its own exceptions first (auth, validation, etc.)
    response = exception_handler(exc, context)

    if response is not None:
        # Re-shape DRF's default response into our envelope
        original_data = response.data
        if isinstance(original_data, dict) and "detail" in original_data:
            message = str(original_data["detail"])
            code = getattr(original_data["detail"], "code", "error")
        elif isinstance(original_data, list):
            message = str(original_data[0]) if original_data else "Bad request."
            code = "validation_error"
        else:
            message = str(original_data)
            code = "error"
        response.data = _make_error(code, message)
        return response

    # Handle domain exceptions
    for exc_type, (http_status, error_code) in _DOMAIN_EXCEPTION_MAP.items():
        if isinstance(exc, exc_type):
            return Response(
                _make_error(error_code, str(exc)),
                status=http_status,
            )

    # Handle value errors from value objects (e.g., invalid domain)
    if isinstance(exc, ValueError):
        return Response(
            _make_error("validation_error", str(exc)),
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Unknown exception — let Django's 500 handler deal with it
    return None
