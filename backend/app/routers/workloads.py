from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Workload
from app.schemas import WorkloadCreate, WorkloadDetail, WorkloadRead
from app.services.argocd_status import get_argocd_apps
from app.services.common import (
    GENERATED_ROOT,
    GITOPS_ROOT,
    record_activity,
    read_json,
    run_command,
    slugify,
)
from app.services.cost_estimator import estimate_workload_cost
from app.services.policy_runner import validate_workload
from app.services.workload_generator import generate_all

router = APIRouter(prefix="/api/workloads", tags=["workloads"])


def serialize(workload: Workload) -> WorkloadRead:
    return WorkloadRead(
        id=workload.id,
        name=workload.name,
        owner=workload.owner,
        environment=workload.environment,
        region=workload.region,
        runtime_type=workload.runtime_type,
        cpu_request=workload.cpu_request,
        cpu_limit=workload.cpu_limit,
        memory_request=workload.memory_request,
        memory_limit=workload.memory_limit,
        replicas=workload.replicas,
        public_access=workload.public_access,
        cost_center=workload.cost_center,
        data_classification=workload.data_classification,
        azure_services=read_json(workload.azure_services_json, []),
        status=workload.status,
        policy_status=workload.policy_status,
        argocd_sync_status=workload.argocd_sync_status,
        estimated_monthly_cost=workload.estimated_monthly_cost,
        created_at=workload.created_at,
        updated_at=workload.updated_at,
    )


def get_workload_or_404(db: Session, workload_id: int) -> Workload:
    workload = db.get(Workload, workload_id)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    return workload


@router.get("", response_model=list[WorkloadRead])
def list_workloads(db: Session = Depends(get_db)) -> list[WorkloadRead]:
    return [serialize(item) for item in db.query(Workload).order_by(Workload.updated_at.desc()).all()]


@router.post("", response_model=WorkloadDetail)
def create_workload(payload: WorkloadCreate, db: Session = Depends(get_db)) -> WorkloadDetail:
    if db.query(Workload).filter(Workload.name == payload.name).first():
        raise HTTPException(status_code=409, detail="A workload with this name already exists")
    workload = Workload(**payload.model_dump(exclude={"azure_services"}), azure_services_json=json.dumps(payload.azure_services))
    db.add(workload)
    db.commit()
    db.refresh(workload)
    files = generate_all(workload)
    policy = validate_workload(workload)
    cost = estimate_workload_cost(workload)
    workload.policy_status = policy["status"]
    workload.last_policy_result_json = json.dumps(policy)
    workload.estimated_monthly_cost = cost["monthly_estimate"]
    workload.last_cost_result_json = json.dumps(cost)
    workload.status = "ready_for_deploy" if policy["status"] == "passed" else "policy_failed"
    db.commit()
    db.refresh(workload)
    record_activity(
        db,
        "workload.created",
        f"{workload.name} onboarded and platform files generated.",
        workload.id,
        "success" if policy["status"] == "passed" else "warning",
    )
    return detail_response(workload, files)


@router.get("/{workload_id}", response_model=WorkloadDetail)
def get_workload(workload_id: int, db: Session = Depends(get_db)) -> WorkloadDetail:
    workload = get_workload_or_404(db, workload_id)
    return detail_response(workload, collect_files(workload))


@router.post("/{workload_id}/generate")
def generate_workload(workload_id: int, db: Session = Depends(get_db)) -> dict[str, dict[str, str]]:
    workload = get_workload_or_404(db, workload_id)
    files = generate_all(workload)
    workload.status = "generated"
    db.commit()
    record_activity(db, "workload.generated", f"Regenerated platform files for {workload.name}.", workload.id)
    return {"files": files}


@router.post("/{workload_id}/validate-policy")
def validate_policy(workload_id: int, db: Session = Depends(get_db)) -> dict:
    workload = get_workload_or_404(db, workload_id)
    result = validate_workload(workload)
    workload.policy_status = result["status"]
    workload.last_policy_result_json = json.dumps(result)
    db.commit()
    record_activity(
        db,
        "policy.validated",
        f"Policy validation {result['status']} for {workload.name}.",
        workload.id,
        "success" if result["status"] == "passed" else "warning",
    )
    return result


@router.post("/{workload_id}/deploy-local")
def deploy_local(workload_id: int, db: Session = Depends(get_db)) -> dict:
    workload = get_workload_or_404(db, workload_id)
    manifest = f"gitops/workloads/{slugify(workload.name)}/workload.yaml"
    result = run_command(["kubectl", "apply", "-f", manifest], timeout=20)
    workload.argocd_sync_status = "applied" if result.get("ok") else "not_available"
    workload.status = "running" if result.get("ok") else workload.status
    db.commit()
    record_activity(
        db,
        "workload.deploy_local",
        f"Local deploy requested for {workload.name}.",
        workload.id,
        "success" if result.get("ok") else "warning",
    )
    return {"result": result, "argocd": get_argocd_apps()}


@router.get("/{workload_id}/files")
def get_files(workload_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    workload = get_workload_or_404(db, workload_id)
    return collect_files(workload)


def collect_files(workload: Workload) -> dict[str, str]:
    name = slugify(workload.name)
    paths = {
        "terraform": GENERATED_ROOT / "terraform" / name / "terraform.tfvars",
        "helm_values": GENERATED_ROOT / "helm-values" / name / "values.yaml",
        "argocd_application": GENERATED_ROOT / "argocd-apps" / name / "application.yaml",
        "kubernetes_manifest": GITOPS_ROOT / "workloads" / name / "workload.yaml",
    }
    if not all(path.is_file() for path in paths.values()):
        paths = {key: Path(value) for key, value in generate_all(workload).items()}

    return {key: path.read_text(encoding="utf-8") if path.is_file() else "" for key, path in paths.items()}


def detail_response(workload: Workload, files: dict[str, str]) -> WorkloadDetail:
    file_contents = {}
    for key, value in files.items():
        file_contents[key] = read_file_content(value)

    return WorkloadDetail(
        **serialize(workload).model_dump(),
        policy_result=read_json(workload.last_policy_result_json, {}),
        cost_result=read_json(workload.last_cost_result_json, {}),
        files=file_contents,
    )


def read_file_content(value: str) -> str:
    if not value:
        return ""

    if "\n" in value:
        return value

    path = Path(value)
    if path.is_file():
        return path.read_text(encoding="utf-8")

    return value
