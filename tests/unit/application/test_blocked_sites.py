"""
Unit tests for blocked site use cases.
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock

from apps.core.application.use_cases.add_blocked_site import (
    AddBlockedSiteInput,
    AddBlockedSiteUseCase,
)
from apps.core.application.use_cases.toggle_blocked_site import ToggleBlockedSiteUseCase
from apps.core.domain.entities import BlockedSite
from apps.core.domain.exceptions import BlockedSiteNotFoundError, SiteAlreadyExistsError


def _make_site(domain: str = "example.com", is_active: bool = True) -> BlockedSite:
    return BlockedSite(id=1, owner_id=1, domain=domain, is_active=is_active)


class TestAddBlockedSiteUseCase:
    def test_adds_valid_domain(self):
        repo = MagicMock()
        repo.get_by_domain.return_value = None
        repo.save.side_effect = lambda s: BlockedSite(
            id=1, owner_id=s.owner_id, domain=s.domain, is_active=s.is_active
        )
        uc = AddBlockedSiteUseCase(repo)
        site = uc.execute(AddBlockedSiteInput(owner_id=1, domain="facebook.com"))
        assert site.domain == "facebook.com"
        assert site.is_active is True

    def test_raises_for_duplicate_domain(self):
        repo = MagicMock()
        repo.get_by_domain.return_value = _make_site("facebook.com")
        uc = AddBlockedSiteUseCase(repo)
        with pytest.raises(SiteAlreadyExistsError):
            uc.execute(AddBlockedSiteInput(owner_id=1, domain="facebook.com"))

    def test_raises_for_invalid_domain(self):
        repo = MagicMock()
        repo.get_by_domain.return_value = None
        uc = AddBlockedSiteUseCase(repo)
        with pytest.raises(ValueError):
            uc.execute(AddBlockedSiteInput(owner_id=1, domain="not a domain!"))

    def test_normalizes_https_prefix(self):
        repo = MagicMock()
        repo.get_by_domain.return_value = None
        repo.save.side_effect = lambda s: s
        uc = AddBlockedSiteUseCase(repo)
        site = uc.execute(AddBlockedSiteInput(owner_id=1, domain="https://facebook.com"))
        assert site.domain == "facebook.com"


class TestToggleBlockedSiteUseCase:
    def test_toggles_to_inactive(self):
        repo = MagicMock()
        repo.get_by_id.return_value = _make_site(is_active=True)
        repo.save.side_effect = lambda s: s
        uc = ToggleBlockedSiteUseCase(repo)
        result = uc.execute(site_id=1, owner_id=1, is_active=False)
        assert result.is_active is False

    def test_raises_not_found(self):
        repo = MagicMock()
        repo.get_by_id.return_value = None
        uc = ToggleBlockedSiteUseCase(repo)
        with pytest.raises(BlockedSiteNotFoundError):
            uc.execute(site_id=999, owner_id=1, is_active=False)
