from __future__ import annotations

from pathlib import Path

import yaml

from app.models import Workload
from app.services.argocd_generator import generate_argocd_application
from app.services.common import GITOPS_ROOT, slugify
from app.services.helm_generator import generate_helm_values
from app.services.terraform_generator import generate_tfvars


def generate_kubernetes_manifests(workload: Workload) -> Path:
    name = slugify(workload.name)
    out_dir = GITOPS_ROOT / "workloads" / name
    out_dir.mkdir(parents=True, exist_ok=True)
    labels = {
        "app.kubernetes.io/name": name,
        "owner": workload.owner,
        "environment": workload.environment,
        "cost-center": workload.cost_center,
        "data-classification": workload.data_classification,
        "managed-by": "azureplatform",
    }
    deployment = {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {"name": name, "namespace": workload.environment, "labels": labels},
        "spec": {
            "replicas": workload.replicas,
            "selector": {"matchLabels": {"app.kubernetes.io/name": name}},
            "template": {
                "metadata": {"labels": labels},
                "spec": {
                    "containers": [{
                        "name": "app",
                        "image": "nginx:1.27-alpine",
                        "ports": [{"containerPort": 80}],
                        "securityContext": {"allowPrivilegeEscalation": False, "runAsNonRoot": True, "runAsUser": 101},
                        "resources": {
                            "requests": {"cpu": workload.cpu_request, "memory": workload.memory_request},
                            "limits": {"cpu": workload.cpu_limit, "memory": workload.memory_limit},
                        },
                    }]
                },
            },
        },
    }
    service = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {"name": name, "namespace": workload.environment, "labels": labels},
        "spec": {
            "type": "LoadBalancer" if workload.public_access else "ClusterIP",
            "selector": {"app.kubernetes.io/name": name},
            "ports": [{"port": 80, "targetPort": 80}],
        },
    }
    path = out_dir / "workload.yaml"
    path.write_text("---\n".join(yaml.safe_dump(item, sort_keys=False) for item in [deployment, service]), encoding="utf-8")
    return path


def generate_all(workload: Workload) -> dict[str, str]:
    paths = {
        "terraform": generate_tfvars(workload),
        "helm_values": generate_helm_values(workload),
        "argocd_application": generate_argocd_application(workload),
        "kubernetes_manifest": generate_kubernetes_manifests(workload),
    }
    return {key: str(path) for key, path in paths.items()}
