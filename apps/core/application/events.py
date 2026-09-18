"""
Event publisher protocol for focus-session events.

Why a Protocol here (not in infrastructure)?
  Use cases need to publish events (start/stop session) but must not
  depend on Channels or any async framework. The Protocol decouples them.
  Infrastructure provides the concrete Channels implementation.

Event payload format (dict, JSON-serializable):
  {
    "type": "session_started" | "session_stopped" | "session_expired",
    "session_id": int,
    "owner_id": int,
    "started_at": "ISO8601",
    "planned_duration_minutes": int | null,
    "ended_at": "ISO8601" | null,
    "blocked_domains": ["domain1.com", ...]
  }
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class FocusSessionEventPublisher(Protocol):
    """
    Publishes focus-session lifecycle events to connected WebSocket clients.

    Implementations must be synchronous-callable so use cases can call them
    without being async themselves. (The concrete Channels impl uses
    async_to_sync internally.)
    """

    def publish_session_started(self, payload: dict[str, Any]) -> None:
        """Broadcast a 'session_started' event to the user's WS group."""
        ...

    def publish_session_stopped(self, payload: dict[str, Any]) -> None:
        """Broadcast a 'session_stopped' event to the user's WS group."""
        ...
