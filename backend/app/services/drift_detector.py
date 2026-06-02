from __future__ import annotations

import json

import yaml

from app.services.common import GITOPS_ROOT, run_command


def check_drift() -> dict:
    findings: list[dict] = []
    for desired_path in (GITOPS_ROOT / "workloads").glob("*/workload.yaml"):
        documents = [doc for doc in yaml.safe_load_all(desired_path.read_text(encoding="utf-8")) if doc]
        for doc in documents:
            kind = doc.get("kind")
            name = doc.get("metadata", {}).get("name")
            namespace = doc.get("metadata", {}).get("namespace", "default")
            if kind != "Deployment":
                continue
            live = run_command(["kubectl", "get", "deployment", name, "-n", namespace, "-o", "json"], timeout=10)
            if not live["available"]:
                return {"available": False, "findings": findings, "message": live["message"], "setup": "Install kubectl and create the kind cluster to run live drift checks."}
            if not live.get("ok"):
                findings.append({"type": "missing_deployment", "resource": f"{namespace}/{name}", "message": "Desired deployment is missing from the cluster."})
                continue
            live_doc = json.loads(live["stdout"])
            desired_replicas = doc.get("spec", {}).get("replicas")
            live_replicas = live_doc.get("spec", {}).get("replicas")
            if desired_replicas != live_replicas:
                findings.append({"type": "changed_replica_count", "resource": f"{namespace}/{name}", "desired": desired_replicas, "actual": live_replicas})
            desired_labels = doc.get("metadata", {}).get("labels", {})
            live_labels = live_doc.get("metadata", {}).get("labels", {})
            for label in ["owner", "environment", "cost-center"]:
                if desired_labels.get(label) != live_labels.get(label):
                    findings.append({"type": "missing_or_changed_label", "resource": f"{namespace}/{name}", "label": label})
            desired_image = doc["spec"]["template"]["spec"]["containers"][0]["image"]
            live_image = live_doc["spec"]["template"]["spec"]["containers"][0]["image"]
            if desired_image != live_image:
                findings.append({"type": "changed_image_tag", "resource": f"{namespace}/{name}", "desired": desired_image, "actual": live_image})
    return {"available": True, "findings": findings, "drift_detected": bool(findings)}


def create_demo_drift() -> dict:
    workload_dirs = list((GITOPS_ROOT / "workloads").glob("*"))
    if not workload_dirs:
        return {"ok": False, "message": "Create and deploy a workload before creating demo drift."}
    name = workload_dirs[0].name
    namespace = "dev"
    result = run_command(["kubectl", "scale", "deployment", name, "-n", namespace, "--replicas=5"], timeout=10)
    if not result["available"]:
        return {"ok": False, "message": result["message"], "setup": result["setup"]}
    return {"ok": result.get("ok", False), "message": f"Requested manual replica drift for deployment {namespace}/{name}.", "command": result["command"], "stderr": result.get("stderr")}
