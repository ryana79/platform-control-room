from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Workload(Base):
    __tablename__ = "workloads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    owner: Mapped[str] = mapped_column(String(120))
    environment: Mapped[str] = mapped_column(String(20), index=True)
    region: Mapped[str] = mapped_column(String(40))
    runtime_type: Mapped[str] = mapped_column(String(30))
    cpu_request: Mapped[str] = mapped_column(String(20))
    cpu_limit: Mapped[str] = mapped_column(String(20))
    memory_request: Mapped[str] = mapped_column(String(20))
    memory_limit: Mapped[str] = mapped_column(String(20))
    replicas: Mapped[int] = mapped_column(Integer, default=2)
    public_access: Mapped[bool] = mapped_column(Boolean, default=False)
    cost_center: Mapped[str] = mapped_column(String(80))
    data_classification: Mapped[str] = mapped_column(String(40))
    azure_services_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(30), default="requested")
    policy_status: Mapped[str] = mapped_column(String(30), default="not_run")
    argocd_sync_status: Mapped[str] = mapped_column(String(30), default="not_deployed")
    estimated_monthly_cost: Mapped[float] = mapped_column(Float, default=0)
    last_policy_result_json: Mapped[str] = mapped_column(Text, default="{}")
    last_cost_result_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Activity(Base):
    __tablename__ = "activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(60))
    message: Mapped[str] = mapped_column(Text)
    workload_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class DeploymentRequest(Base):
    __tablename__ = "deployment_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    deployment_type: Mapped[str] = mapped_column(String(40), index=True)
    name: Mapped[str] = mapped_column(String(80), index=True)
    owner: Mapped[str] = mapped_column(String(120))
    environment: Mapped[str] = mapped_column(String(20), index=True)
    region: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(40), default="collecting_requirements")
    answers_json: Mapped[str] = mapped_column(Text, default="{}")
    spec_json: Mapped[str] = mapped_column(Text, default="{}")
    files_json: Mapped[str] = mapped_column(Text, default="{}")
    gitlab_result_json: Mapped[str] = mapped_column(Text, default="{}")
    branch_name: Mapped[str] = mapped_column(String(160), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
