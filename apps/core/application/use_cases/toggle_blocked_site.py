"""
Use Case: Toggle Blocked Site Active State

Enables or disables a blocked site without deleting it.
"""

from __future__ import annotations

from apps.core.domain.entities import BlockedSite, BlockedSiteId, UserId
from apps.core.domain.exceptions import BlockedSiteNotFoundError
from apps.core.domain.repositories import BlockedSiteRepository


class ToggleBlockedSiteUseCase:
    def __init__(self, blocked_site_repo: BlockedSiteRepository) -> None:
        self._repo = blocked_site_repo

    def execute(self, site_id: BlockedSiteId, owner_id: UserId, is_active: bool) -> BlockedSite:
        site = self._repo.get_by_id(site_id, owner_id)
        if site is None:
            raise BlockedSiteNotFoundError(site_id)
        site.is_active = is_active
        return self._repo.save(site)
