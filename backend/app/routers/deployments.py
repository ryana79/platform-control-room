from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DeploymentRequest
from app.schemas import DeploymentAnswer, DeploymentGenerateResponse, DeploymentRead, DeploymentSessionCreate, GitLabPushResponse
from app.services.common import GENERATED_ROOT, read_json, record_activity
from app.services.deployment_templates import (
    answer_key_for_question,
    build_spec,
    deployment_name,
    deployment_catalog,
    next_question,
    render_deployment_files,
)
from app.services.gitlab_client import push_generated_files
from app.services.grok_client import enrich_deployment_spec, grok_available

router = APIRouter(prefix="/api", tags=["deployments"])


@router.get("/deployment-catalog")
def get_deployment_catalog() -> dict:
    return {"catalog": deployment_catalog(), "ai_available": grok_available()}


@router.post("/deployments/session", response_model=DeploymentRead)
def create_deployment_session(payload: DeploymentSessionCreate, db: Session = Depends(get_db)) -> DeploymentRead:
    session = DeploymentRequest(
        session_id=str(uuid4()),
        deployment_type=payload.deployment_type,
        name=payload.name,
        owner=payload.owner,
        environment=payload.environment,
        region=payload.region,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    record_activity(db, "deployment.session", f"Started Azure deployment generator for {session.name}.", None, "info")
    return serialize(session)


@router.post("/deployments/session/{session_id}/answer", response_model=DeploymentRead)
def answer_deployment_question(session_id: str, payload: DeploymentAnswer, db: Session = Depends(get_db)) -> DeploymentRead:
    session = get_session_or_404(db, session_id)
    answers = read_json(session.answers_json, {})
    answer_key = answer_key_for_question(session.deployment_type, answers)
    if not answer_key:
        return serialize(session)

    answers[answer_key] = payload.answer
    session.answers_json = json.dumps(answers)
    if next_question(session.deployment_type, answers) is None:
        session.status = "requirements_ready"
    db.commit()
    db.refresh(session)
    return serialize(session)


@router.post("/deployments/{session_id}/generate", response_model=DeploymentGenerateResponse)
def generate_deployment(session_id: str, db: Session = Depends(get_db)) -> DeploymentGenerateResponse:
    session = get_session_or_404(db, session_id)
    answers = read_json(session.answers_json, {})
    missing = next_question(session.deployment_type, answers)
    if missing:
        raise HTTPException(status_code=400, detail=f"Requirements are incomplete. Next question: {missing}")

    base = {
        "deployment_type": session.deployment_type,
        "name": session.name,
        "owner": session.owner,
        "environment": session.environment,
        "region": session.region,
    }
    spec = build_spec(base, answers)
    spec["ai"] = enrich_deployment_spec(session.deployment_type, base, answers)
    files = prefix_files(session, render_deployment_files(spec))
    write_generated_files(session, files)
    session.spec_json = json.dumps(spec)
    session.files_json = json.dumps(files)
    session.branch_name = deployment_branch_name(session)
    session.status = "generated"
    db.commit()
    db.refresh(session)
    record_activity(db, "deployment.generated", f"Generated Terraform and GitLab pipeline for {session.name}.", None, "success")
    return DeploymentGenerateResponse(deployment=serialize(session), files=files)


@router.post("/deployments/{session_id}/push-gitlab", response_model=GitLabPushResponse)
def push_deployment_to_gitlab(session_id: str, db: Session = Depends(get_db)) -> GitLabPushResponse:
    session = get_session_or_404(db, session_id)
    files = read_json(session.files_json, {})
    if not files:
        generated = generate_deployment(session_id, db)
        files = generated.files
        session = get_session_or_404(db, session_id)

    branch = session.branch_name or deployment_branch_name(session)
    result = push_generated_files(branch, files, f"Add generated Azure deployment for {session.name}")
    session.branch_name = branch
    session.gitlab_result_json = json.dumps(result)
    session.status = "pushed_to_gitlab" if result["ok"] else "gitlab_not_configured"
    db.commit()
    db.refresh(session)
    record_activity(db, "deployment.gitlab", result["message"], None, "success" if result["ok"] else "warning")
    return GitLabPushResponse(**result)


def get_session_or_404(db: Session, session_id: str) -> DeploymentRequest:
    session = db.query(DeploymentRequest).filter(DeploymentRequest.session_id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Deployment session not found")
    return session


def serialize(session: DeploymentRequest) -> DeploymentRead:
    answers = read_json(session.answers_json, {})
    return DeploymentRead(
        id=session.id,
        session_id=session.session_id,
        deployment_type=session.deployment_type,
        name=session.name,
        owner=session.owner,
        environment=session.environment,
        region=session.region,
        status=session.status,
        current_question=next_question(session.deployment_type, answers),
        answers=answers,
        spec=read_json(session.spec_json, {}),
        files=read_json(session.files_json, {}),
        gitlab_result=read_json(session.gitlab_result_json, {}),
        branch_name=session.branch_name,
        ai_available=grok_available(),
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def prefix_files(session: DeploymentRequest, files: dict[str, str]) -> dict[str, str]:
    root = f"deployments/{deployment_name(session.name)}"
    return {f"{root}/{path}": content for path, content in files.items()}


def deployment_branch_name(session: DeploymentRequest) -> str:
    return f"deploy/{deployment_name(session.name)}-{session.session_id[:8]}"


def write_generated_files(session: DeploymentRequest, files: dict[str, str]) -> None:
    root = GENERATED_ROOT / "azure-deployments" / deployment_name(session.name)
    for path, content in files.items():
        relative = path.split("/", 2)[-1]
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
