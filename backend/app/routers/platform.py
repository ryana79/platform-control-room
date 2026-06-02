from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, Workload
from app.schemas import ActivityRead
from app.services.argocd_status import get_argocd_apps
from app.services.common import workload_services
from app.services.demo_seed import advance_demo, reset_demo_data
from app.services.drift_detector import check_drift, create_demo_drift
from app.services.kubernetes_status import get_kubernetes_status
from app.services.policy_runner import policy_catalog
from app.services.reports import generate_cost_report

router = APIRouter(prefix="/api", tags=["platform"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    workloads = db.query(Workload).all()
    failed = [item for item in workloads if item.policy_status == "failed"]
    running = [item for item in workloads if item.status == "running"]
    drift = check_drift()
    activity = db.query(Activity).order_by(Activity.created_at.desc()).limit(6).all()
    cost_total = monthly_total(workloads)
    by_env = {env: len([item for item in workloads if item.environment == env]) for env in ["dev", "staging", "prod"]}
    return {
        "total_workloads": len(workloads),
        "running_workloads": len(running),
        "failed_policy_checks": len(failed),
        "estimated_monthly_cost": cost_total,
        "drift_findings": len(drift.get("findings", [])),
        "last_argocd_sync": "local CLI unavailable" if not get_argocd_apps()["cli"].get("available") else "see ArgoCD page",
        "cost_trend": [{"month": month, "cost": round(cost_total * factor, 2)} for month, factor in [("Jan", .72), ("Feb", .8), ("Mar", .9), ("Apr", 1.0), ("May", 1.08)]],
        "workload_status": [{"name": key, "value": value} for key, value in by_env.items()],
        "recent_activity": [ActivityRead.model_validate(item).model_dump() for item in activity],
    }


@router.get("/policies")
def policies(db: Session = Depends(get_db)):
    workloads = db.query(Workload).all()
    return {
        "catalog": policy_catalog(),
        "passing_workloads": [item.name for item in workloads if item.policy_status == "passed"],
        "failed_workloads": [item.name for item in workloads if item.policy_status == "failed"],
        "violations": [{"workload": item.name, "result": item.last_policy_result_json} for item in workloads if item.policy_status == "failed"],
    }


@router.get("/topology")
def topology(db: Session = Depends(get_db)):
    workloads = db.query(Workload).all()
    return {
        "nodes": [
            {"id": "portal", "label": "Portal", "value": f"{len(workloads)} requests", "status": "online"},
            {"id": "api", "label": "FastAPI", "value": "REST control plane", "status": "online"},
            {"id": "database", "label": "Database", "value": "SQLite/Postgres", "status": "online"},
            {"id": "policy", "label": "Policy", "value": f"{len([item for item in workloads if item.policy_status == 'failed'])} blocked", "status": "guarded"},
            {"id": "gitops", "label": "GitOps", "value": f"{len(workloads)} apps", "status": "generated"},
            {"id": "cost", "label": "Cost", "value": f"${monthly_total(workloads)}", "status": "estimated"},
        ],
        "edges": [
            {"from": "portal", "to": "api", "label": "request"},
            {"from": "api", "to": "database", "label": "persist"},
            {"from": "api", "to": "policy", "label": "validate"},
            {"from": "api", "to": "gitops", "label": "generate"},
            {"from": "api", "to": "cost", "label": "estimate"},
        ],
        "workloads": [
            {
                "name": item.name,
                "environment": item.environment,
                "status": item.status,
                "policy_status": item.policy_status,
                "services": workload_services(item),
            }
            for item in workloads
        ],
    }


@router.get("/argocd/apps")
def argocd_apps():
    return get_argocd_apps()


@router.get("/kubernetes/status")
def kubernetes_status():
    return get_kubernetes_status()


@router.post("/drift/check")
def drift_check():
    return check_drift()


@router.post("/drift/create-demo-drift")
def drift_demo():
    return create_demo_drift()


@router.get("/cost/estimate")
def cost_estimate(db: Session = Depends(get_db)):
    workloads = db.query(Workload).all()
    return {"monthly_total": monthly_total(workloads), "workloads": [{"name": item.name, "cost": item.estimated_monthly_cost, "environment": item.environment} for item in workloads]}


@router.post("/reports/generate")
def reports(db: Session = Depends(get_db)):
    return generate_cost_report(db.query(Workload).all())


@router.get("/activity", response_model=list[ActivityRead])
def activity(db: Session = Depends(get_db)):
    return db.query(Activity).order_by(Activity.created_at.desc()).limit(25).all()


@router.post("/demo/reset")
def demo_reset(db: Session = Depends(get_db)):
    reset_demo_data(db)
    return {"ok": True, "message": "Demo data reset and platform files regenerated."}


@router.post("/demo/advance")
def demo_advance(db: Session = Depends(get_db)):
    return advance_demo(db)


def monthly_total(workloads: list[Workload]) -> float:
    return round(sum(item.estimated_monthly_cost for item in workloads), 2)
