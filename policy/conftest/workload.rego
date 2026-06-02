package azureplatform.workload

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.cpu
  msg := sprintf("%s must set a CPU limit", [input.metadata.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("%s must set a memory limit", [input.metadata.name])
}

deny[msg] {
  input.kind == "Deployment"
  not input.metadata.labels.owner
  msg := sprintf("%s must include owner label", [input.metadata.name])
}

deny[msg] {
  input.kind == "Service"
  input.spec.type == "LoadBalancer"
  not input.metadata.annotations["azureplatform.io/public-access-approved"]
  msg := sprintf("%s exposes a public IP without approval", [input.metadata.name])
}
