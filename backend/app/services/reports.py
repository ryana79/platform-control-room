from __future__ import annotations

from datetime import datetime

from app.models import Workload
from app.services.common import REPORTS_ROOT, workload_services


def generate_cost_report(workloads: list[Workload]) -> dict:
    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)
    total = sum(workload.estimated_monthly_cost for workload in workloads)
    lines = [
        "# AzurePlatform Cost Governance Report",
        "",
        f"Generated: {datetime.utcnow().isoformat()}Z",
        "",
        f"Estimated monthly total: ${total:.2f}",
        "",
        "| Workload | Environment | Services | Monthly Estimate |",
        "| --- | --- | --- | ---: |",
    ]
    for workload in workloads:
        lines.append(f"| {workload.name} | {workload.environment} | {', '.join(workload_services(workload))} | ${workload.estimated_monthly_cost:.2f} |")
    lines.extend(["", "## Governance Recommendations", "", "- Right-size non-production replicas.", "- Require owners and cost centers for chargeback.", "- Review public access and confidential data workloads monthly."])
    path = REPORTS_ROOT / "cost-governance-report.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"path": str(path), "monthly_total": round(total, 2)}
