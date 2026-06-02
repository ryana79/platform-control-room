# AI GitLab Deployment Generator

Platform Control Room includes a safe Azure deployment generator for teams that want self-service infrastructure requests without giving the portal direct permission to apply changes.

## Flow

1. A user chooses a deployment type: Resource Group, Storage Account, or Linux VM.
2. The intake flow asks follow-up questions. If an OpenAI-compatible provider is configured, the AI layer enriches the final deployment summary and recommendations. Groq Cloud is the default free-tier recommendation.
3. The backend renders Terraform files and a `.gitlab-ci.yml` pipeline.
4. The backend can push the generated files to a dedicated GitLab deployment repository.
5. GitLab runs `terraform fmt`, `terraform validate`, and `terraform plan`.
6. `terraform apply` is intentionally manual/protected.

## Required Environment Variables

```bash
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
# Optional aliases also work:
# GROQ_API_KEY=gsk_...
# XAI_API_KEY=xai-...
GITLAB_BASE_URL=https://gitlab.com
GITLAB_PROJECT_ID=group/project-or-numeric-id
GITLAB_TOKEN=glpat-...
```

Do not commit these values. Use local `.env`, Vercel environment variables, or another secret manager.

## GitLab Token Scope

Use a dedicated GitLab project for generated deployment pipelines. The token should be scoped narrowly to that project and support repository file/commit operations.

## Safety Model

- No automatic Azure apply from the portal.
- Generated GitLab `apply` stage is manual.
- Linux VM generation is a plan template and should not be applied without cost review.
- The Azure connector lite workflow proves identity, state, Resource Graph, Cost Management, and Terraform plan without running AKS.

## API Endpoints

- `GET /api/deployment-catalog`
- `POST /api/deployments/session`
- `POST /api/deployments/session/{session_id}/answer`
- `POST /api/deployments/{session_id}/generate`
- `POST /api/deployments/{session_id}/push-gitlab`
