"""
Testing settings.

Key overrides:
  - In-memory channel layer (no Redis required for unit/integration tests).
  - Fast password hasher to speed up test fixtures.
  - Separate test database prefix via pytest-django.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

# Fast password hasher for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# In-memory channel layer — no Redis required during tests
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# Disable throttling during tests
REST_FRAMEWORK = {  # type: ignore[assignment]
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}
