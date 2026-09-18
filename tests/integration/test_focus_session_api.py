"""
Integration tests for Focus Session API endpoints.

Tests start/stop/active/history/stats workflows with real DB.
"""

import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestFocusSessionAPI:
    def test_start_session(self, api_client):
        url = reverse("focus-session-start")
        resp = api_client.post(url, {}, format="json")
        assert resp.status_code == 201
        assert resp.data["status"] == "active"

    def test_start_session_with_duration(self, api_client):
        url = reverse("focus-session-start")
        resp = api_client.post(url, {"planned_duration_minutes": 25}, format="json")
        assert resp.status_code == 201
        assert resp.data["planned_duration_minutes"] == 25

    def test_cannot_start_two_sessions(self, api_client):
        url = reverse("focus-session-start")
        api_client.post(url, {}, format="json")
        resp = api_client.post(url, {}, format="json")
        assert resp.status_code == 409
        assert resp.data["error"]["code"] == "session_already_active"

    def test_stop_session(self, api_client):
        start_resp = api_client.post(reverse("focus-session-start"), {}, format="json")
        session_id = start_resp.data["id"]

        stop_url = reverse("focus-session-stop", kwargs={"session_id": session_id})
        resp = api_client.post(stop_url)
        assert resp.status_code == 200
        assert resp.data["status"] == "finished"
        assert resp.data["ended_at"] is not None

    def test_get_active_session_none(self, api_client):
        url = reverse("focus-session-active")
        resp = api_client.get(url)
        assert resp.status_code == 200
        assert resp.data["has_active_session"] is False

    def test_get_active_session_with_session(self, api_client):
        api_client.post(reverse("focus-session-start"), {}, format="json")
        resp = api_client.get(reverse("focus-session-active"))
        assert resp.status_code == 200
        assert resp.data["has_active_session"] is True

    def test_history_includes_finished_sessions(self, api_client):
        start_resp = api_client.post(reverse("focus-session-start"), {}, format="json")
        session_id = start_resp.data["id"]
        api_client.post(reverse("focus-session-stop", kwargs={"session_id": session_id}))

        resp = api_client.get(reverse("focus-session-history"))
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]["status"] == "finished"

    def test_stats_after_session(self, api_client):
        start_resp = api_client.post(reverse("focus-session-start"), {}, format="json")
        session_id = start_resp.data["id"]
        api_client.post(reverse("focus-session-stop", kwargs={"session_id": session_id}))

        resp = api_client.get(reverse("focus-session-stats"))
        assert resp.status_code == 200
        assert resp.data["total_sessions"] == 1
        assert resp.data["completed_sessions"] == 1

    def test_user_isolation_stop(self, api_client, api_client2):
        """user2 cannot stop user's session."""
        start_resp = api_client.post(reverse("focus-session-start"), {}, format="json")
        session_id = start_resp.data["id"]

        stop_url = reverse("focus-session-stop", kwargs={"session_id": session_id})
        resp2 = api_client2.post(stop_url)
        assert resp2.status_code == 404

    def test_invalid_duration_rejected(self, api_client):
        resp = api_client.post(
            reverse("focus-session-start"),
            {"planned_duration_minutes": 0},
            format="json",
        )
        assert resp.status_code == 400
