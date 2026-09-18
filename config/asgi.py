"""
ASGI configuration.

Request flow:
  HTTP  → Django (via ProtocolTypeRouter)
  WS    → JwtAuthMiddleware → URLRouter → FocusSessionConsumer

Layer notes:
  - JwtAuthMiddleware (infrastructure layer) validates the ?token= query
    param and sets scope["user"] before Channels processes the connection.
  - The channel layer (Redis in production, in-memory in tests) is
    configured in settings.CHANNEL_LAYERS.
"""

import os

import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

# Import after django.setup() so apps are ready
from apps.core.infrastructure.ws_auth_middleware import JwtAuthMiddleware  # noqa: E402
from config.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            JwtAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        ),
    }
)
