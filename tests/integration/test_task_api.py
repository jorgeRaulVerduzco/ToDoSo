"""
Integration tests for Task API endpoints.

Tests HTTP → use case → DB round-trip.
Verifies user isolation (user cannot see/modify user2's tasks).
"""

import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestTaskAPI:
    def test_create_task(self, api_client):
        url = reverse("task-list-create")
        resp = api_client.post(url, {"title": "Buy milk", "priority": "high"}, format="json")
        assert resp.status_code == 201
        assert resp.data["title"] == "Buy milk"
        assert resp.data["status"] == "pending"
        assert resp.data["priority"] == "high"

    def test_list_tasks_empty(self, api_client):
        url = reverse("task-list-create")
        resp = api_client.get(url)
        assert resp.status_code == 200
        assert resp.data == []

    def test_list_tasks_with_data(self, api_client):
        url = reverse("task-list-create")
        api_client.post(url, {"title": "Task 1"}, format="json")
        api_client.post(url, {"title": "Task 2"}, format="json")
        resp = api_client.get(url)
        assert resp.status_code == 200
        assert len(resp.data) == 2

    def test_filter_by_status(self, api_client):
        url = reverse("task-list-create")
        task_resp = api_client.post(url, {"title": "Task A"}, format="json")
        task_id = task_resp.data["id"]
        # Mark as completed
        api_client.patch(
            reverse("task-detail", kwargs={"task_id": task_id}),
            {"status": "completed"},
            format="json",
        )
        resp = api_client.get(url, {"status": "completed"})
        assert resp.status_code == 200
        assert len(resp.data) == 1

    def test_update_task(self, api_client):
        url = reverse("task-list-create")
        task_resp = api_client.post(url, {"title": "Old title"}, format="json")
        task_id = task_resp.data["id"]

        detail_url = reverse("task-detail", kwargs={"task_id": task_id})
        resp = api_client.patch(detail_url, {"title": "New title"}, format="json")
        assert resp.status_code == 200
        assert resp.data["title"] == "New title"

    def test_delete_task(self, api_client):
        url = reverse("task-list-create")
        task_resp = api_client.post(url, {"title": "Delete me"}, format="json")
        task_id = task_resp.data["id"]

        detail_url = reverse("task-detail", kwargs={"task_id": task_id})
        resp = api_client.delete(detail_url)
        assert resp.status_code == 204

        # Verify gone
        resp = api_client.get(url)
        assert len(resp.data) == 0

    def test_user_isolation(self, api_client, api_client2):
        """user2 cannot see or modify user's tasks."""
        url = reverse("task-list-create")
        task_resp = api_client.post(url, {"title": "My task"}, format="json")
        task_id = task_resp.data["id"]

        # user2 list is empty
        resp2 = api_client2.get(url)
        assert len(resp2.data) == 0

        # user2 delete attempt → 404
        detail_url = reverse("task-detail", kwargs={"task_id": task_id})
        resp2 = api_client2.delete(detail_url)
        assert resp2.status_code == 404

    def test_unauthenticated_returns_401(self, client):
        url = reverse("task-list-create")
        resp = client.get(url)
        assert resp.status_code == 401
