# Interview Notes

## Why Terraform modules were used
Terraform modules model reusable platform building blocks: AKS, ACR, networking, Key Vault, Log Analytics, and Azure Policy. They show how a platform team standardizes infrastructure while allowing workload-specific inputs.

## Why GitOps was used
GitOps creates an auditable desired state. The portal generates ArgoCD Applications and manifests so deployment state can be reviewed, synced, and drift-checked.

## Why ArgoCD was chosen
ArgoCD is a common Kubernetes GitOps controller with clear sync and health concepts that are easy to demo locally with kind.

## Why OPA/Gatekeeper and Azure Policy both exist
Gatekeeper enforces Kubernetes admission policies. Azure Policy is represented for cloud control-plane governance. In production, both are needed because platform rules span cluster resources and Azure resources.

## How workload onboarding works
The form captures ownership, runtime, resources, public access, cost center, data classification, and services. FastAPI saves the request, generates files, validates policy, estimates cost, and exposes results through REST APIs.

## How drift detection works
The desired state comes from generated GitOps manifests. The actual state comes from `kubectl`. Differences such as missing deployments, replica changes, image changes, or missing labels become findings.

## How cost governance works
The estimator uses workload configuration, selected services, environment, and replica count to create transparent monthly estimates and recommendations.

## How secrets are avoided
The local demo uses SQLite, kind, and generated examples. `.env.example` documents configuration but no real credentials, subscription IDs, or secrets are committed.

## Why SQLite locally and Postgres publicly
SQLite keeps the local demo free, portable, and easy to reset. Hosted Postgres makes the public demo credible because multiple visitors can create workloads and see durable state without depending on a local file inside an ephemeral container.

## What is live in the hosted demo
The public deployment can run the portal, backend API, workload database, file generation, policy validation, demo reset/advance actions, and cost reporting. Local Kubernetes, ArgoCD, Gatekeeper, and live kubectl drift checks remain local-only because free web hosts do not provide a nested cluster or privileged runtime.

## How this would scale in a real company
The SQLite database would move to Postgres, generated files would be committed through pull requests, approvals would integrate with ticketing, and cost estimates would connect to pricing APIs.

## What would change in production
Add SSO/RBAC, audit logs, real Azure identity, remote Terraform state, private container registry, managed secrets, policy exemptions, and environment promotion workflows.
