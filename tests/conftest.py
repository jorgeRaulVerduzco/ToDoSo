"""
Shared test fixtures and helpers.

Fixtures used across unit and integration tests:
  - django_db_setup: standard pytest-django fixture (DB reset per test)
  - api_client: DRF APIClient pre-authenticated with a test user
  - user / user2: factory fixtures for user isolation tests
"""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpassword123",
    )


@pytest.fixture
def user2(db):
    return User.objects.create_user(
        username="otheruser",
        email="other@example.com",
        password="testpassword123",
    )


@pytest.fixture
def api_client(user) -> APIClient:
    """Authenticated DRF test client for `user`."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def api_client2(user2) -> APIClient:
    """Authenticated DRF test client for `user2`."""
    client = APIClient()
    refresh = RefreshToken.for_user(user2)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client
