from app.main import app
from fastapi.testclient import TestClient
from uuid import uuid4


def test_health():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_summary_shape():
    with TestClient(app) as client:
        response = client.get("/api/summary")
    assert response.status_code == 200
    assert "total_workloads" in response.json()


def test_deployment_generator_flow():
    name = f"test-rg-{uuid4().hex[:8]}"
    with TestClient(app) as client:
        catalog = client.get("/api/deployment-catalog")
        assert catalog.status_code == 200
        assert catalog.json()["catalog"]

        session = client.post(
            "/api/deployments/session",
            json={
                "deployment_type": "resource_group",
                "name": name,
                "owner": "platform-tests",
                "environment": "dev",
                "region": "eastus",
            },
        )
        assert session.status_code == 200
        payload = session.json()
        assert payload["current_question"]

        session_id = payload["session_id"]
        first_answer = client.post(f"/api/deployments/session/{session_id}/answer", json={"answer": "test landing zone"})
        assert first_answer.status_code == 200
        second_answer = client.post(f"/api/deployments/session/{session_id}/answer", json={"answer": "internal"})
        assert second_answer.status_code == 200
        assert second_answer.json()["current_question"] is None

        generated = client.post(f"/api/deployments/{session_id}/generate")
        assert generated.status_code == 200
        files = generated.json()["files"]
        assert any(path.endswith(".gitlab-ci.yml") for path in files)
        assert any(path.endswith("main.tf") for path in files)
