from __future__ import annotations

import json
import shutil
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Activity, Workload
from app.services.common import GENERATED_ROOT, GITOPS_ROOT, REPORTS_ROOT, record_activity
from app.services.cost_estimator import estimate_workload_cost
from app.services.policy_runner import validate_workload
from app.services.workload_generator import generate_all


DEMO_WORKLOADS = [
    {
        "name": "payments-api",
        "owner": "platform-payments",
        "environment": "dev",
        "region": "eastus",
        "runtime_type": "api",
        "cpu_request": "250m",
        "cpu_limit": "500m",
        "memory_request": "256Mi",
        "memory_limit": "512Mi",
        "replicas": 2,
        "public_access": False,
        "cost_center": "cc-platform-042",
        "data_classification": "internal",
        "azure_services": ["AKS", "ACR", "Log Analytics"],
        "status": "ready_for_deploy",
    },
    {
        "name": "risk-worker",
        "owner": "risk-platform",
        "environment": "staging",
        "region": "eastus",
        "runtime_type": "worker",
        "cpu_request": "500m",
        "cpu_limit": "1000m",
        "memory_request": "512Mi",
        "memory_limit": "1Gi",
        "replicas": 3,
        "public_access": False,
        "cost_center": "cc-risk-118",
        "data_classification": "confidential",
        "azure_services": ["AKS", "ACR", "Key Vault", "Storage", "Log Analytics"],
        "status": "running",
        "argocd_sync_status": "synced",
    },
    {
        "name": "public-portal-prod",
        "owner": "customer-experience",
        "environment": "prod",
        "region": "westus2",
        "runtime_type": "frontend",
        "cpu_request": "250m",
        "cpu_limit": "750m",
        "memory_request": "256Mi",
        "memory_limit": "768Mi",
        "replicas": 4,
        "public_access": True,
        "cost_center": "cc-web-204",
        "data_classification": "public",
        "azure_services": ["AKS", "ACR", "Storage", "Log Analytics"],
        "status": "policy_failed",
    },
]

GENERATED_ARTIFACT_DIRS = [
    GENERATED_ROOT / "terraform",
    GENERATED_ROOT / "helm-values",
    GENERATED_ROOT / "argocd-apps",
    GITOPS_ROOT / "apps",
]


def seed_demo_data(db: Session) -> None:
    if db.query(Workload).count() > 0:
        return

    for demo_workload in DEMO_WORKLOADS:
        item = demo_workload.copy()
        services = item.pop("azure_services")
        workload = Workload(**item, azure_services_json=json.dumps(services))
        db.add(workload)
        db.commit()
        db.refresh(workload)

        generate_all(workload)
        policy_result = validate_workload(workload)
        cost_result = estimate_workload_cost(workload)
        workload.policy_status = policy_result["status"]
        workload.last_policy_result_json = json.dumps(policy_result)
        workload.estimated_monthly_cost = cost_result["monthly_estimate"]
        workload.last_cost_result_json = json.dumps(cost_result)
        db.commit()
        record_activity(
            db,
            "demo.seeded",
            f"Seeded demo workload {workload.name} with generated platform files.",
            workload.id,
            "success" if policy_result["status"] == "passed" else "warning",
        )


def reset_demo_data(db: Session) -> None:
    db.query(Activity).delete()
    db.query(Workload).delete()
    db.commit()
    _clear_generated_artifacts()
    seed_demo_data(db)


def advance_demo(db: Session) -> dict:
    workload = db.query(Workload).filter(Workload.name == "payments-api").first()
    if workload is None:
        seed_demo_data(db)
        workload = db.query(Workload).filter(Workload.name == "payments-api").first()

    if workload is None:
        return {"ok": False, "message": "Demo workload could not be created."}

    next_state = {
        "ready_for_deploy": ("running", "synced", "Workload payments-api promoted from generated request to running local deployment."),
        "running": ("policy_failed", "out_of_sync", "Demo advanced payments-api into an out-of-sync policy review state."),
        "policy_failed": ("ready_for_deploy", "not_deployed", "Demo reset payments-api to a clean ready-for-deploy state."),
    }
    status, sync_status, message = next_state.get(workload.status, next_state["ready_for_deploy"])
    workload.status = status
    workload.argocd_sync_status = sync_status
    db.commit()
    record_activity(db, "demo.advance", message, workload.id, "warning" if status == "policy_failed" else "success")
    return {"ok": True, "message": message, "workload": workload.name, "status": status, "argocd_sync_status": sync_status}


def _clear_generated_artifacts() -> None:
    for folder in GENERATED_ARTIFACT_DIRS:
        folder.mkdir(parents=True, exist_ok=True)
        for path in folder.glob("*"):
            if path.name != ".gitkeep":
                _remove_path(path)

    workloads_root = GITOPS_ROOT / "workloads"
    workloads_root.mkdir(parents=True, exist_ok=True)
    for path in workloads_root.glob("*"):
        if path.name not in {".gitkeep", "sample-api"}:
            _remove_path(path)

    report = REPORTS_ROOT / "cost-governance-report.md"
    if report.exists():
        report.unlink()


def _remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
        return

    path.unlink()
