"""
JWT WebSocket Authentication Middleware.

Validates the ?token=<JWT> query parameter on WebSocket upgrade requests
and injects an authenticated Django User into scope["user"].

This mirrors how DRF's JWTAuthentication works for HTTP, but adapted for
the ASGI WebSocket handshake where HTTP Authorization headers are not
available in most browser extension environments.

Usage:
  In config/asgi.py, wrap the URLRouter:
    JwtAuthMiddleware(URLRouter(websocket_urlpatterns))
"""

from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str: str) -> Any:
    """Validate JWT and return the corresponding User, or AnonymousUser."""
    try:
        token = AccessToken(token_str)
        user_id = token["user_id"]
        return User.objects.get(pk=user_id)
    except (TokenError, InvalidToken, User.DoesNotExist):
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    """
    ASGI middleware that authenticates WebSocket connections via JWT.

    Reads the 'token' query parameter from the WebSocket URL, validates it,
    and sets scope["user"] to the authenticated User (or AnonymousUser).
    """

    async def __call__(self, scope: dict, receive: Any, send: Any) -> None:
        if scope["type"] == "websocket":
            query_string = scope.get("query_string", b"").decode()
            params = parse_qs(query_string)
            token_list = params.get("token", [])

            if token_list:
                scope["user"] = await get_user_from_token(token_list[0])
            else:
                scope["user"] = AnonymousUser()

        await super().__call__(scope, receive, send)
