from __future__ import annotations

from pathlib import Path

import yaml

from app.models import Workload
from app.services.common import GENERATED_ROOT, GITOPS_ROOT, slugify


def generate_argocd_application(workload: Workload) -> Path:
    name = slugify(workload.name)
    app = {
        "apiVersion": "argoproj.io/v1alpha1",
        "kind": "Application",
        "metadata": {"name": name, "namespace": "argocd"},
        "spec": {
            "project": "default",
            "source": {
                "repoURL": "https://github.com/example/azureplatform-local-demo.git",
                "targetRevision": "HEAD",
                "path": f"gitops/workloads/{name}",
            },
            "destination": {"server": "https://kubernetes.default.svc", "namespace": workload.environment},
            "syncPolicy": {"automated": {"prune": True, "selfHeal": True}, "syncOptions": ["CreateNamespace=true"]},
        },
    }
    out_dir = GENERATED_ROOT / "argocd-apps" / name
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "application.yaml"
    path.write_text(yaml.safe_dump(app, sort_keys=False), encoding="utf-8")
    (GITOPS_ROOT / "apps").mkdir(parents=True, exist_ok=True)
    (GITOPS_ROOT / "apps" / f"{name}.yaml").write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    return path
