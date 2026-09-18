"""
Use Case: Remove Blocked Site

Removes a site from the block list. Uses ownership check via repo.
"""

from __future__ import annotations

from apps.core.domain.entities import BlockedSiteId, UserId
from apps.core.domain.exceptions import BlockedSiteNotFoundError
from apps.core.domain.repositories import BlockedSiteRepository


class RemoveBlockedSiteUseCase:
    def __init__(self, blocked_site_repo: BlockedSiteRepository) -> None:
        self._repo = blocked_site_repo

    def execute(self, site_id: BlockedSiteId, owner_id: UserId) -> None:
        site = self._repo.get_by_id(site_id, owner_id)
        if site is None:
            raise BlockedSiteNotFoundError(site_id)
        self._repo.delete(site_id, owner_id)
