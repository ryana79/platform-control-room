from __future__ import annotations

import json
from pathlib import Path

import yaml

from app.services.common import GENERATED_ROOT, run_command


def get_argocd_apps() -> dict:
    generated = []
    for path in (GENERATED_ROOT / "argocd-apps").glob("*/application.yaml"):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        generated.append({
            "name": data["metadata"]["name"],
            "namespace": data["metadata"].get("namespace", "argocd"),
            "path": str(path),
            "desired_namespace": data["spec"]["destination"]["namespace"],
        })
    cli = run_command(["argocd", "app", "list", "-o", "json"], timeout=15)
    live = []
    if cli.get("ok") and cli.get("stdout"):
        try:
            live = json.loads(cli["stdout"])
        except json.JSONDecodeError:
            live = []
    return {
        "generated_apps": generated,
        "live_apps": live,
        "cli": cli,
        "instructions": "Open ArgoCD with: kubectl port-forward svc/argocd-server -n argocd 8080:443",
    }
