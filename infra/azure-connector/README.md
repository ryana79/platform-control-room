# Azure Connector Lite

This Terraform stack validates a real Azure connector without running AKS or paid compute.

It uses GitHub Actions OIDC to authenticate to Azure, initializes Terraform state in Azure Storage, reads the current subscription, and runs a real `terraform plan` against Azure.

The stack intentionally creates no workload infrastructure. It is meant to prove identity, remote state, subscription visibility, and safe plan execution.

## What It Validates

- Entra ID app registration and service principal
- GitHub Actions OIDC federation for the `main` branch
- Azure Storage backend for Terraform state
- Terraform provider authentication against Azure
- Azure subscription/resource visibility
- No AKS cluster and no always-on compute

## Required GitHub Secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `TF_STATE_RESOURCE_GROUP`
- `TF_STATE_STORAGE_ACCOUNT`
- `TF_STATE_CONTAINER`

Use `scripts/bootstrap-azure-connector.sh` after refreshing `az login` to create the Azure-side resources and populate these secrets.
