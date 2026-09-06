from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


Environment = Literal["dev", "staging", "prod"]
RuntimeType = Literal["api", "worker", "frontend", "cronjob"]
DataClassification = Literal["public", "internal", "confidential", "restricted"]


class WorkloadCreate(BaseModel):
    name: str = Field(min_length=3, max_length=80, pattern=r"^[a-z0-9-]+$")
    owner: str = Field(min_length=2, max_length=120)
    environment: Environment
    region: str = "eastus"
    runtime_type: RuntimeType
    cpu_request: str = "250m"
    cpu_limit: str = "500m"
    memory_request: str = "256Mi"
    memory_limit: str = "512Mi"
    replicas: int = Field(default=2, ge=1, le=20)
    public_access: bool = False
    cost_center: str = Field(min_length=2, max_length=80)
    data_classification: DataClassification = "internal"
    azure_services: list[str] = Field(default_factory=lambda: ["AKS", "ACR", "Log Analytics"])


class WorkloadRead(WorkloadCreate):
    id: int
    status: str
    policy_status: str
    argocd_sync_status: str
    estimated_monthly_cost: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkloadDetail(WorkloadRead):
    policy_result: dict[str, Any]
    cost_result: dict[str, Any]
    files: dict[str, str]


class ActivityRead(BaseModel):
    id: int
    event_type: str
    message: str
    workload_id: int | None
    severity: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


DeploymentType = Literal["resource_group", "storage_account", "linux_vm"]


class DeploymentSessionCreate(BaseModel):
    deployment_type: DeploymentType
    name: str = Field(min_length=3, max_length=80, pattern=r"^[a-z0-9-]+$")
    owner: str = Field(min_length=2, max_length=120)
    environment: Environment = "dev"
    region: str = "eastus"


class DeploymentAnswer(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)


class DeploymentRead(BaseModel):
    id: int
    session_id: str
    deployment_type: str
    name: str
    owner: str
    environment: str
    region: str
    status: str
    current_question: str | None
    answers: dict[str, Any]
    spec: dict[str, Any]
    files: dict[str, str]
    gitlab_result: dict[str, Any]
    branch_name: str
    ai_available: bool
    created_at: datetime
    updated_at: datetime


class DeploymentGenerateResponse(BaseModel):
    deployment: DeploymentRead
    files: dict[str, str]


class GitLabPushResponse(BaseModel):
    ok: bool
    configured: bool
    branch: str
    message: str
    web_url: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
