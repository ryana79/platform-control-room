from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

from app.models import Activity, Workload


def find_repo_root() -> Path:
    data_root = os.getenv("AZUREPLATFORM_DATA_ROOT")
    if data_root:
        root = Path(data_root)
        root.mkdir(parents=True, exist_ok=True)
        return root

    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / "generated").exists() and (candidate / "gitops").exists():
            return candidate
        if (candidate / "docker-compose.yml").exists():
            return candidate
    return current.parents[2]


REPO_ROOT = find_repo_root()
GENERATED_ROOT = REPO_ROOT / "generated"
REPORTS_ROOT = REPO_ROOT / "reports"
GITOPS_ROOT = REPO_ROOT / "gitops"
POLICY_ROOT = REPO_ROOT / "policy"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")


def read_json(value: str, default: Any) -> Any:
    try:
        return json.loads(value)
    except Exception:
        return default


def workload_services(workload: Workload) -> list[str]:
    return read_json(workload.azure_services_json, [])


def record_activity(db, event_type: str, message: str, workload_id: int | None = None, severity: str = "info") -> None:
    db.add(Activity(event_type=event_type, message=message, workload_id=workload_id, severity=severity))
    db.commit()


def run_command(command: list[str], timeout: int = 20) -> dict[str, Any]:
    executable = command[0]
    if shutil.which(executable) is None:
        return {
            "available": False,
            "ok": False,
            "command": " ".join(command),
            "message": f"{executable} is not installed or not on PATH.",
            "setup": f"Install {executable} and rerun the local demo script.",
        }
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
        return {
            "available": True,
            "ok": completed.returncode == 0,
            "command": " ".join(command),
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
            "returncode": completed.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "available": True,
            "ok": False,
            "command": " ".join(command),
            "message": "Command timed out.",
        }
