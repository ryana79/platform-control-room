from __future__ import annotations

import json

from app.services.common import run_command


def get_kubernetes_status() -> dict:
    version = run_command(["kubectl", "version", "--client=true", "-o", "json"])
    if not version["available"]:
        return {"available": False, "message": version["message"], "setup": "Run ./scripts/create-kind-cluster.sh after installing kind and kubectl."}
    namespaces = run_command(["kubectl", "get", "namespaces", "-o", "json"])
    deployments = run_command(["kubectl", "get", "deployments", "-A", "-o", "json"])
    pods = run_command(["kubectl", "get", "pods", "-A", "-o", "json"])
    services = run_command(["kubectl", "get", "services", "-A", "-o", "json"])

    def parse(result: dict) -> list[dict]:
        if not result.get("ok"):
            return []
        return json.loads(result.get("stdout") or "{}").get("items", [])

    return {
        "available": True,
        "namespaces": [{"name": item["metadata"]["name"], "status": item.get("status", {}).get("phase", "Unknown")} for item in parse(namespaces)],
        "deployments": [{
            "namespace": item["metadata"]["namespace"],
            "name": item["metadata"]["name"],
            "ready": item.get("status", {}).get("readyReplicas", 0),
            "desired": item.get("spec", {}).get("replicas", 0),
        } for item in parse(deployments)],
        "pods": [{
            "namespace": item["metadata"]["namespace"],
            "name": item["metadata"]["name"],
            "phase": item.get("status", {}).get("phase", "Unknown"),
        } for item in parse(pods)[:50]],
        "services": [{
            "namespace": item["metadata"]["namespace"],
            "name": item["metadata"]["name"],
            "type": item.get("spec", {}).get("type", "ClusterIP"),
        } for item in parse(services)],
    }
