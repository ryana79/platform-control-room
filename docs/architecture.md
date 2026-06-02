# Architecture

AzurePlatform uses a Next.js portal, FastAPI API, SQLite source of truth, generated Terraform/Helm/ArgoCD files, local kind Kubernetes, ArgoCD, Gatekeeper, Conftest, drift detection, and cost reports.

```mermaid
flowchart LR
  UI[Next.js Portal] --> API[FastAPI]
  API --> DB[(SQLite)]
  API --> GEN[Generated Files]
  GEN --> TF[Terraform tfvars]
  GEN --> GITOPS[ArgoCD Apps + Manifests]
  API --> POLICY[Conftest Policies]
  GITOPS --> KIND[kind Cluster]
  KIND --> GATEKEEPER[OPA Gatekeeper]
  API --> DRIFT[Drift Detector]
  API --> COST[Cost Reports]
```
