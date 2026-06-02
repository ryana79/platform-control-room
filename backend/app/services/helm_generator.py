from __future__ import annotations

from pathlib import Path

import yaml

from app.models import Workload
from app.services.common import GENERATED_ROOT, slugify


def generate_helm_values(workload: Workload) -> Path:
    out_dir = GENERATED_ROOT / "helm-values" / slugify(workload.name)
    out_dir.mkdir(parents=True, exist_ok=True)
    values = {
        "name": workload.name,
        "replicaCount": workload.replicas,
        "image": {"repository": "ghcr.io/example/azureplatform-sample-api", "tag": "local-demo"},
        "service": {"type": "LoadBalancer" if workload.public_access else "ClusterIP", "port": 80},
        "resources": {
            "requests": {"cpu": workload.cpu_request, "memory": workload.memory_request},
            "limits": {"cpu": workload.cpu_limit, "memory": workload.memory_limit},
        },
        "labels": {
            "owner": workload.owner,
            "environment": workload.environment,
            "cost-center": workload.cost_center,
            "data-classification": workload.data_classification,
            "managed-by": "azureplatform",
        },
    }
    path = out_dir / "values.yaml"
    path.write_text(yaml.safe_dump(values, sort_keys=False), encoding="utf-8")
    return path
