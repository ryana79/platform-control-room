from __future__ import annotations

from app.models import Workload
from app.services.common import POLICY_ROOT, run_command, slugify


def validate_workload(workload: Workload) -> dict:
    violations: list[dict] = []
    if not workload.cpu_limit or not workload.memory_limit:
        violations.append({"policy": "require-resource-limits", "message": "CPU and memory limits are required."})
    if not workload.owner or not workload.environment or not workload.cost_center:
        violations.append({"policy": "require-platform-labels", "message": "owner, environment, and cost-center labels are required."})
    if workload.public_access and workload.environment == "prod":
        violations.append({"policy": "deny-public-ip-unapproved", "message": "Production public access requires explicit approval."})
    if workload.data_classification in {"confidential", "restricted"} and "Key Vault" not in workload.azure_services_json:
        violations.append({"policy": "require-keyvault-sensitive-data", "message": "Sensitive workloads must include Key Vault."})
    if workload.replicas > 10:
        violations.append({"policy": "restrict-expensive-capacity", "message": "Replica count above 10 requires platform review."})

    manifest = f"gitops/workloads/{slugify(workload.name)}/workload.yaml"
    conftest = run_command(["conftest", "test", manifest, "--policy", str(POLICY_ROOT / "conftest")], timeout=15)
    status = "passed" if not violations else "failed"
    return {
        "status": status,
        "violations": violations,
        "conftest": conftest,
        "summary": f"{len(violations)} platform policy violation(s) found.",
    }


def policy_catalog() -> list[dict]:
    return [
        {"id": "require-resource-limits", "name": "Require CPU and memory limits", "engine": "Gatekeeper + Conftest", "severity": "high"},
        {"id": "disallow-privileged-containers", "name": "Disallow privileged containers", "engine": "Gatekeeper", "severity": "critical"},
        {"id": "require-platform-labels", "name": "Require owner/environment/cost-center labels", "engine": "Gatekeeper + Conftest", "severity": "high"},
        {"id": "deny-public-ip-unapproved", "name": "Deny public IP unless approved", "engine": "Conftest", "severity": "medium"},
        {"id": "require-mandatory-tags", "name": "Require mandatory Azure tags", "engine": "Conftest", "severity": "high"},
        {"id": "restrict-expensive-skus", "name": "Restrict expensive VM SKUs", "engine": "Conftest", "severity": "medium"},
    ]
