# Azure Connector Lite

Platform Control Room is local-first, but this connector adds a real Azure integration path without running AKS or paid compute.

## What Gets Added

- Entra ID app registration and service principal
- GitHub Actions OIDC federation for `ryana79/platform-control-room`
- Azure Resource Group for connector metadata
- Azure Storage Account and blob container for Terraform state
- Terraform plan workflow that authenticates to Azure using OIDC
- Azure Resource Graph read check
- Azure Cost Management month-to-date read check

## Cost Profile

This setup avoids AKS, VM nodes, App Service plans, and always-on compute.

Expected cost is approximately `$0-10/month`, mostly from the Storage Account used for Terraform state. For a tiny state file, this is typically cents per month, but you should still monitor Azure Cost Management.

## One-Time Bootstrap

Refresh Azure MFA first:

```bash
az logout
az login --tenant "b92d2b23-4d35-4470-93ff-69aca6632ffe" --scope "https://management.core.windows.net//.default"
```

Then run:

```bash
./scripts/bootstrap-azure-connector.sh
```

The script creates Azure-side connector resources and writes these GitHub secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `TF_STATE_RESOURCE_GROUP`
- `TF_STATE_STORAGE_ACCOUNT`
- `TF_STATE_CONTAINER`

## Validate Locally

```bash
./scripts/azure-connector-health.sh
terraform -chdir=infra/azure-connector init -backend=false
terraform -chdir=infra/azure-connector validate
terraform -chdir=infra/azure-connector plan -input=false
```

## Validate in GitHub Actions

After bootstrap, manually run:

```text
Actions -> azure-connector-plan -> Run workflow
```

The workflow logs into Azure with GitHub OIDC, reads Azure Resource Graph, initializes the Azure Storage backend, validates Terraform, and runs a real plan against the subscription.

## What This Does Not Do

- It does not create AKS.
- It does not deploy workloads into Azure.
- It does not create paid compute.
- It does not store client secrets.

This keeps the public portfolio demo safe while proving the missing Azure connector layer.
