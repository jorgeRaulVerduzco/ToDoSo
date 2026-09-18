"""
Use Case: List Blocked Sites

Returns all blocked sites for a user (optionally only active ones).
"""

from __future__ import annotations

from dataclasses import dataclass

from apps.core.domain.entities import BlockedSite, UserId
from apps.core.domain.repositories import BlockedSiteRepository


@dataclass(frozen=True)
class ListBlockedSitesInput:
    owner_id: UserId
    active_only: bool = False


class ListBlockedSitesUseCase:
    def __init__(self, blocked_site_repo: BlockedSiteRepository) -> None:
        self._repo = blocked_site_repo

    def execute(self, data: ListBlockedSitesInput) -> list[BlockedSite]:
        return self._repo.list_for_user(data.owner_id, active_only=data.active_only)
