"""
Channel Event Publisher — concrete implementation of FocusSessionEventPublisher.

Publishes events to a per-user Channels group named "focus_{owner_id}".
All connected WebSocket clients for that user receive the broadcast.

Why sync? Use cases are sync. We use async_to_sync so use cases don't
need to be async themselves, keeping the application layer framework-agnostic.
"""

from __future__ import annotations

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _user_group_name(owner_id: int) -> str:
    """Canonical group name for a user's focus-session WebSocket group."""
    return f"focus_{owner_id}"


class ChannelLayerEventPublisher:
    """
    Concrete FocusSessionEventPublisher that broadcasts via Django Channels.

    The message type keys ("session.started", "session.stopped") must match
    handler method names in FocusSessionConsumer (Channels convention).
    """

    def __init__(self) -> None:
        self._channel_layer = get_channel_layer()
        self._send = async_to_sync(self._channel_layer.group_send)

    def publish_session_started(self, payload: dict[str, Any]) -> None:
        group = _user_group_name(payload["owner_id"])
        self._send(group, {"type": "session.started", "payload": payload})

    def publish_session_stopped(self, payload: dict[str, Any]) -> None:
        group = _user_group_name(payload["owner_id"])
        self._send(group, {"type": "session.stopped", "payload": payload})
