#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
rm -f backend/app/data/azureplatform.db
rm -rf generated/terraform/* generated/helm-values/* generated/argocd-apps/* reports/cost-governance-report.md
python3 - <<'PY'
from pathlib import Path
import shutil

for path in Path("gitops/apps").glob("*"):
    if path.name != ".gitkeep" and path.is_file():
        path.unlink()

for path in Path("gitops/workloads").glob("*"):
    if path.name not in {".gitkeep", "sample-api"}:
        shutil.rmtree(path) if path.is_dir() else path.unlink()
PY
