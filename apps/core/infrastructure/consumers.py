"""
WebSocket Consumer — FocusSessionConsumer.

Handles real-time focus-session events for connected clients.

Connection flow:
  1. Client connects to ws://host/ws/focus-sessions/?token=<JWT>
  2. JwtAuthMiddleware validates the token and sets scope["user"].
  3. Consumer joins the user's Channels group ("focus_{user_id}").
  4. On group events (session.started, session.stopped), consumer
     forwards the payload to the client as JSON.
  5. On disconnect, consumer leaves the group.

Security:
  - Only authenticated users can connect (anonymous → close 4001).
  - Each user is in their own group; they never see other users' events.

Note: The consumer itself does NOT start/stop sessions; it only relays
events published by use cases via ChannelLayerEventPublisher.
"""

from __future__ import annotations

import json
from typing import Any

from channels.generic.websocket import AsyncJsonWebsocketConsumer


def _user_group_name(user_id: int) -> str:
    return f"focus_{user_id}"


class FocusSessionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self) -> None:
        user = self.scope.get("user")

        # Reject anonymous connections
        if user is None or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id: int = user.pk
        self.group_name: str = _user_group_name(self.user_id)

        # Join user-specific group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send current state on connect so the client has an initial snapshot
        # (the client can also call GET /api/focus-sessions/active/ for the same)
        await self.send_json({"type": "connected", "user_id": self.user_id})

    async def disconnect(self, close_code: int) -> None:
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content: dict[str, Any], **kwargs: Any) -> None:
        """
        Clients are not expected to send messages (read-only channel).
        We silently ignore any incoming frames, but could add ping/pong here.
        """

    # ------------------------------------------------------------------
    # Group event handlers (called by channel layer when a message is sent
    # to the group by ChannelLayerEventPublisher)
    # ------------------------------------------------------------------

    async def session_started(self, event: dict[str, Any]) -> None:
        """Relay 'session_started' event to the WebSocket client."""
        await self.send_json(event["payload"])

    async def session_stopped(self, event: dict[str, Any]) -> None:
        """Relay 'session_stopped' event to the WebSocket client."""
        await self.send_json(event["payload"])
