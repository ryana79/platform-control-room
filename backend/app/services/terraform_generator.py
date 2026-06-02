from __future__ import annotations

from pathlib import Path

from app.models import Workload
from app.services.common import GENERATED_ROOT, slugify, workload_services


def generate_tfvars(workload: Workload) -> Path:
    out_dir = GENERATED_ROOT / "terraform" / slugify(workload.name)
    out_dir.mkdir(parents=True, exist_ok=True)
    services = workload_services(workload)
    content = f'''workload_name       = "{workload.name}"
environment         = "{workload.environment}"
location            = "{workload.region}"
owner               = "{workload.owner}"
cost_center         = "{workload.cost_center}"
data_classification = "{workload.data_classification}"
public_access       = {str(workload.public_access).lower()}
enabled_services    = {services!r}
aks_node_count      = {max(workload.replicas, 1)}
tags = {{
  owner               = "{workload.owner}"
  environment         = "{workload.environment}"
  cost_center         = "{workload.cost_center}"
  data_classification = "{workload.data_classification}"
  managed_by          = "azureplatform"
}}
'''
    path = out_dir / "terraform.tfvars"
    path.write_text(content.replace("'", '"'), encoding="utf-8")
    return path
