"""
Domain Exceptions — raised by use cases and domain methods.

All exceptions are pure Python; no Django or DRF imports.
HTTP translation (e.g., 404 → SessionNotFoundError) is done in the
interfaces layer's error_handlers.py.
"""


class DomainError(Exception):
    """Base class for all domain-level errors."""


class SessionAlreadyActiveError(DomainError):
    """Raised when trying to start a focus session while one is already active."""

    def __init__(self, user_id: int) -> None:
        super().__init__(f"User {user_id} already has an active focus session.")
        self.user_id = user_id


class SessionNotActiveError(DomainError):
    """Raised when an operation requires an active session but none exists."""

    def __init__(self, session_id: int) -> None:
        super().__init__(f"Session {session_id} is not active.")
        self.session_id = session_id


class SessionNotFoundError(DomainError):
    """Raised when a requested focus session does not exist."""

    def __init__(self, session_id: int) -> None:
        super().__init__(f"FocusSession {session_id} not found.")
        self.session_id = session_id


class TaskNotFoundError(DomainError):
    """Raised when a requested task does not exist or does not belong to the user."""

    def __init__(self, task_id: int) -> None:
        super().__init__(f"Task {task_id} not found.")
        self.task_id = task_id


class BlockedSiteNotFoundError(DomainError):
    """Raised when a requested blocked-site entry does not exist."""

    def __init__(self, site_id: int) -> None:
        super().__init__(f"BlockedSite {site_id} not found.")
        self.site_id = site_id


class SiteAlreadyExistsError(DomainError):
    """Raised when a user tries to add a domain that is already in their list."""

    def __init__(self, domain: str, user_id: int) -> None:
        super().__init__(f"Domain '{domain}' is already in the block list for user {user_id}.")
        self.domain = domain
        self.user_id = user_id


class UnauthorizedError(DomainError):
    """Raised when a user tries to access a resource that belongs to another user."""

    def __init__(self, resource: str) -> None:
        super().__init__(f"Access denied to {resource}.")
        self.resource = resource
