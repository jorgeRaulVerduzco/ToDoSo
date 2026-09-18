"""
Integration tests for Blocked Sites API endpoints.
"""

import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestBlockedSitesAPI:
    def test_add_site(self, api_client):
        url = reverse("blocked-site-list-create")
        resp = api_client.post(url, {"domain": "facebook.com"}, format="json")
        assert resp.status_code == 201
        assert resp.data["domain"] == "facebook.com"
        assert resp.data["is_active"] is True

    def test_add_duplicate_site_conflict(self, api_client):
        url = reverse("blocked-site-list-create")
        api_client.post(url, {"domain": "facebook.com"}, format="json")
        resp = api_client.post(url, {"domain": "facebook.com"}, format="json")
        assert resp.status_code == 409
        assert resp.data["error"]["code"] == "site_already_exists"

    def test_list_sites(self, api_client):
        url = reverse("blocked-site-list-create")
        api_client.post(url, {"domain": "facebook.com"}, format="json")
        api_client.post(url, {"domain": "twitter.com"}, format="json")
        resp = api_client.get(url)
        assert resp.status_code == 200
        assert len(resp.data) == 2

    def test_toggle_site_inactive(self, api_client):
        url = reverse("blocked-site-list-create")
        resp = api_client.post(url, {"domain": "reddit.com"}, format="json")
        site_id = resp.data["id"]

        detail_url = reverse("blocked-site-detail", kwargs={"site_id": site_id})
        resp = api_client.patch(detail_url, {"is_active": False}, format="json")
        assert resp.status_code == 200
        assert resp.data["is_active"] is False

    def test_delete_site(self, api_client):
        url = reverse("blocked-site-list-create")
        resp = api_client.post(url, {"domain": "tiktok.com"}, format="json")
        site_id = resp.data["id"]

        detail_url = reverse("blocked-site-detail", kwargs={"site_id": site_id})
        resp = api_client.delete(detail_url)
        assert resp.status_code == 204

        resp = api_client.get(url)
        assert len(resp.data) == 0

    def test_user_isolation(self, api_client, api_client2):
        url = reverse("blocked-site-list-create")
        resp = api_client.post(url, {"domain": "example.com"}, format="json")
        site_id = resp.data["id"]

        # user2 list is empty
        resp2 = api_client2.get(url)
        assert len(resp2.data) == 0

        # user2 cannot delete user's site
        resp2 = api_client2.delete(
            reverse("blocked-site-detail", kwargs={"site_id": site_id})
        )
        assert resp2.status_code == 404

    def test_invalid_domain_rejected(self, api_client):
        url = reverse("blocked-site-list-create")
        resp = api_client.post(url, {"domain": "not a domain!"}, format="json")
        assert resp.status_code == 400
