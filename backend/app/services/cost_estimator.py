from __future__ import annotations

from app.models import Workload
from app.services.common import workload_services


SERVICE_BASE_COSTS = {
    "AKS": 73.0,
    "ACR": 5.0,
    "Key Vault": 3.0,
    "Storage": 8.0,
    "Log Analytics": 18.0,
}

ENV_MULTIPLIERS = {"dev": 0.65, "staging": 0.85, "prod": 1.25}


def estimate_workload_cost(workload: Workload) -> dict:
    services = workload_services(workload)
    replica_cost = max(workload.replicas, 1) * 14.5
    service_costs = {service: SERVICE_BASE_COSTS.get(service, 0) for service in services}
    subtotal = replica_cost + sum(service_costs.values())
    multiplier = ENV_MULTIPLIERS.get(workload.environment, 1.0)
    monthly = round(subtotal * multiplier, 2)
    recommendations: list[str] = []
    if workload.environment != "prod" and workload.replicas > 2:
        recommendations.append("Reduce non-production replicas to 1-2 unless load testing.")
    if "Log Analytics" in services:
        recommendations.append("Set daily ingestion caps and retention windows for Log Analytics.")
    if workload.public_access:
        recommendations.append("Review public access approval and prefer private ingress where possible.")
    if "Key Vault" not in services and workload.data_classification in {"confidential", "restricted"}:
        recommendations.append("Add Key Vault for confidential or restricted workloads.")
    return {
        "currency": "USD",
        "environment_multiplier": multiplier,
        "replica_compute_estimate": round(replica_cost * multiplier, 2),
        "service_estimates": {k: round(v * multiplier, 2) for k, v in service_costs.items()},
        "monthly_estimate": monthly,
        "recommendations": recommendations,
    }
