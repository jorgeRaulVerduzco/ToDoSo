"""
WebSocket URL routing.

Maps:
  ws://host/ws/focus-sessions/  →  FocusSessionConsumer
"""

from django.urls import path

from apps.core.infrastructure.consumers import FocusSessionConsumer

websocket_urlpatterns = [
    path("ws/focus-sessions/", FocusSessionConsumer.as_asgi()),
]
