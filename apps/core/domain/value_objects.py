"""
Domain Value Objects — immutable wrappers with validation.

All validation logic lives here so that invalid values can never
enter the domain. No Django or framework imports.
"""

from __future__ import annotations

import re


class Domain:
    """
    A validated internet domain name (e.g., "facebook.com").

    Rules:
      - Must not include a scheme (no "https://").
      - Must not include a path.
      - Must match the basic hostname pattern.
    """

    _DOMAIN_RE = re.compile(
        r"^(?:[a-zA-Z0-9]"
        r"(?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?"
        r"\.)+[a-zA-Z]{2,}$"
    )

    def __init__(self, value: str) -> None:
        cleaned = value.strip().lower()
        # Strip scheme if accidentally included
        for scheme in ("https://", "http://", "www."):
            if cleaned.startswith(scheme):
                cleaned = cleaned[len(scheme):]
        # Strip trailing slash / path
        cleaned = cleaned.split("/")[0]
        if not self._DOMAIN_RE.match(cleaned):
            raise ValueError(
                f"'{value}' is not a valid domain. "
                "Use the format 'example.com' (no scheme, no path)."
            )
        self._value = cleaned

    @property
    def value(self) -> str:
        return self._value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Domain):
            return self._value == other._value
        return NotImplemented

    def __hash__(self) -> int:
        return hash(self._value)

    def __str__(self) -> str:
        return self._value

    def __repr__(self) -> str:
        return f"Domain({self._value!r})"


class DurationMinutes:
    """
    A positive integer representing a session duration in minutes.

    Enforces that the value is between 1 and 1440 (24 hours).
    """

    MIN = 1
    MAX = 1440

    def __init__(self, value: int) -> None:
        if not isinstance(value, int):
            raise TypeError(f"Duration must be an integer, got {type(value).__name__}.")
        if not (self.MIN <= value <= self.MAX):
            raise ValueError(
                f"Duration must be between {self.MIN} and {self.MAX} minutes, got {value}."
            )
        self._value = value

    @property
    def value(self) -> int:
        return self._value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, DurationMinutes):
            return self._value == other._value
        return NotImplemented

    def __hash__(self) -> int:
        return hash(self._value)

    def __int__(self) -> int:
        return self._value

    def __repr__(self) -> str:
        return f"DurationMinutes({self._value})"
