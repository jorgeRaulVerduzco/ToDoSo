"""
Integration tests for the WebSocket FocusSessionConsumer.

Uses channels.testing.WebsocketCommunicator to test the consumer
without a real HTTP server. The in-memory channel layer (configured in
testing.py settings) means these tests run without Redis.

Note: JwtAuthMiddleware is bypassed here by directly setting scope["user"]
in the communicator. The middleware itself is tested separately.
"""

from __future__ import annotations

import json
import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.infrastructure.consumers import FocusSessionConsumer

User = get_user_model()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestFocusSessionConsumer:
    async def _make_communicator(self, user):
        """Create a communicator with the user injected into scope."""
        communicator = WebsocketCommunicator(
            FocusSessionConsumer.as_asgi(),
            "/ws/focus-sessions/",
            headers=[],
        )
        communicator.scope["user"] = user
        return communicator

    async def test_connect_authenticated(self, user):
        communicator = await self._make_communicator(user)
        connected, _ = await communicator.connect()
        assert connected

        # Should receive the 'connected' confirmation
        response = await communicator.receive_json_from()
        assert response["type"] == "connected"
        assert response["user_id"] == user.pk

        await communicator.disconnect()

    async def test_anonymous_connection_rejected(self):
        from django.contrib.auth.models import AnonymousUser

        communicator = WebsocketCommunicator(
            FocusSessionConsumer.as_asgi(),
            "/ws/focus-sessions/",
        )
        communicator.scope["user"] = AnonymousUser()
        connected, code = await communicator.connect()
        assert not connected
        assert code == 4001

    async def test_receives_session_started_event(self, user):
        from channels.layers import get_channel_layer
        from asgiref.sync import sync_to_async

        communicator = await self._make_communicator(user)
        connected, _ = await communicator.connect()
        assert connected
        await communicator.receive_json_from()  # discard 'connected' message

        # Simulate the channel layer sending a group event
        channel_layer = get_channel_layer()
        group_name = f"focus_{user.pk}"
        payload = {
            "type": "session_started",
            "session_id": 1,
            "owner_id": user.pk,
            "started_at": "2024-01-01T10:00:00",
            "planned_duration_minutes": 25,
            "ended_at": None,
            "blocked_domains": ["facebook.com"],
        }
        await channel_layer.group_send(
            group_name,
            {"type": "session.started", "payload": payload},
        )

        response = await communicator.receive_json_from()
        assert response["type"] == "session_started"
        assert response["session_id"] == 1
        assert response["blocked_domains"] == ["facebook.com"]

        await communicator.disconnect()
