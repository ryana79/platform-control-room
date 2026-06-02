# Free Public Deployment

AzurePlatform supports two credible demo modes:

- Local infrastructure demo: SQLite, Docker Compose, kind, ArgoCD, Gatekeeper, Conftest, generated files, and live kubectl checks.
- Public portfolio demo: Vercel frontend, free hosted backend, and free hosted Postgres.

## Recommended Free Stack

Use:

- Vercel for `frontend/`
- Render free web service for `backend/`
- Neon or Supabase free Postgres for the database

This lets people open a public URL, create workloads, persist requests, view generated artifacts, run policy checks, simulate platform workflow progress, and generate cost reports.

## What Works Publicly

- Mission Control dashboard
- Workload creation
- SQLite-equivalent persistence through hosted Postgres
- Generated Terraform tfvars
- Generated Helm values
- Generated ArgoCD Application YAML
- Generated Kubernetes manifests
- Policy validation
- Cost governance reports
- Demo reset and advance actions

## What Remains Local-Only

Free web hosts generally cannot run a nested Kubernetes cluster or privileged Docker workloads. These remain local:

- kind cluster
- ArgoCD controller
- Gatekeeper admission controller
- live kubectl drift detection

The hosted demo still shows graceful setup guidance for unavailable local tooling.

## Backend Deployment

1. Create a free Postgres database in Neon or Supabase.
2. Copy the connection string.
3. Create a Render web service from this repo using `render.yaml`.
4. Set environment variables:

```bash
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Render will build the backend Dockerfile and use the host-provided `PORT`.

## Frontend Deployment

1. Import `frontend/` into Vercel.
2. Set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend.onrender.com
```

3. Deploy.

## Resume Positioning

Describe the hosted deployment as the public product demo and the local Docker/kind setup as the infrastructure lab. That distinction is honest and stronger than pretending a free serverless host runs a Kubernetes platform stack.
