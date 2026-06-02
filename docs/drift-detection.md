# Drift Detection

The drift detector compares generated GitOps manifests in `gitops/workloads` with live Kubernetes deployment state from `kubectl`.
