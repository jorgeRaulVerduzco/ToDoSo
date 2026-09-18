"""
Use Case: Add Blocked Site

Validates the domain value object and ensures no duplicates per user.
"""

from __future__ import annotations

from dataclasses import dataclass

from apps.core.domain.entities import BlockedSite, UserId
from apps.core.domain.exceptions import SiteAlreadyExistsError
from apps.core.domain.repositories import BlockedSiteRepository
from apps.core.domain.value_objects import Domain


@dataclass(frozen=True)
class AddBlockedSiteInput:
    owner_id: UserId
    domain: str        # raw string; validated via Domain value object


class AddBlockedSiteUseCase:
    def __init__(self, blocked_site_repo: BlockedSiteRepository) -> None:
        self._repo = blocked_site_repo

    def execute(self, data: AddBlockedSiteInput) -> BlockedSite:
        validated_domain = Domain(data.domain)  # raises ValueError if invalid

        existing = self._repo.get_by_domain(validated_domain.value, data.owner_id)
        if existing is not None:
            raise SiteAlreadyExistsError(validated_domain.value, data.owner_id)

        site = BlockedSite(
            id=0,
            owner_id=data.owner_id,
            domain=validated_domain.value,
            is_active=True,
        )
        return self._repo.save(site)
