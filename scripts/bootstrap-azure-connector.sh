#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-ryana79/platform-control-room}"
LOCATION="${AZURE_LOCATION:-eastus}"
RESOURCE_GROUP="${TF_STATE_RESOURCE_GROUP:-rg-platform-control-room-connector}"
CONTAINER="${TF_STATE_CONTAINER:-tfstate}"
APP_NAME="${AZURE_APP_NAME:-platform-control-room-github-oidc}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

set_github_secret() {
  gh secret set "$1" --repo "$REPO" --body "$2"
}

create_role_assignment() {
  az role assignment create \
    --assignee "$APP_ID" \
    --role "$1" \
    --scope "$2" \
    -o table || true
}

require_command az
require_command gh
require_command shasum

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"
STORAGE_ACCOUNT="${TF_STATE_STORAGE_ACCOUNT:-pcrtfstate$(printf '%s' "$SUBSCRIPTION_ID" | shasum -a 256 | cut -c1-8)}"

echo "Creating connector resource group: $RESOURCE_GROUP"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags project=platform-control-room environment=connector managed_by=script purpose=terraform-state \
  -o table

echo "Creating low-cost Terraform state storage account: $STORAGE_ACCOUNT"
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --tags project=platform-control-room environment=connector managed_by=script purpose=terraform-state \
  -o table

echo "Creating Terraform state container: $CONTAINER"
az storage container create \
  --account-name "$STORAGE_ACCOUNT" \
  --name "$CONTAINER" \
  --auth-mode login \
  -o table

APP_ID="$(az ad app list --display-name "$APP_NAME" --query '[0].appId' -o tsv)"
if [[ -z "$APP_ID" ]]; then
  APP_ID="$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)"
fi

APP_OBJECT_ID="$(az ad app show --id "$APP_ID" --query id -o tsv)"
SP_OBJECT_ID="$(az ad sp list --filter "appId eq '$APP_ID'" --query '[0].id' -o tsv)"
if [[ -z "$SP_OBJECT_ID" ]]; then
  SP_OBJECT_ID="$(az ad sp create --id "$APP_ID" --query id -o tsv)"
fi

SUBJECT="repo:${REPO}:ref:refs/heads/main"
if [[ -z "$(az ad app federated-credential list --id "$APP_OBJECT_ID" --query "[?name=='github-main'].name | [0]" -o tsv)" ]]; then
  az ad app federated-credential create \
    --id "$APP_OBJECT_ID" \
    --parameters "{\"name\":\"github-main\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"$SUBJECT\",\"description\":\"GitHub Actions main branch for $REPO\",\"audiences\":[\"api://AzureADTokenExchange\"]}" \
    -o table
fi

create_role_assignment Reader "/subscriptions/$SUBSCRIPTION_ID"
create_role_assignment "Storage Blob Data Contributor" "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT"

set_github_secret AZURE_CLIENT_ID "$APP_ID"
set_github_secret AZURE_TENANT_ID "$TENANT_ID"
set_github_secret AZURE_SUBSCRIPTION_ID "$SUBSCRIPTION_ID"
set_github_secret TF_STATE_RESOURCE_GROUP "$RESOURCE_GROUP"
set_github_secret TF_STATE_STORAGE_ACCOUNT "$STORAGE_ACCOUNT"
set_github_secret TF_STATE_CONTAINER "$CONTAINER"

cat <<SUMMARY

Azure connector lite is configured.

Repository:          $REPO
Tenant ID:           $TENANT_ID
Subscription ID:     $SUBSCRIPTION_ID
Client ID:           $APP_ID
Resource group:      $RESOURCE_GROUP
Storage account:     $STORAGE_ACCOUNT
State container:     $CONTAINER
Federated subject:   $SUBJECT

Run this workflow manually in GitHub Actions:
azure-connector-plan
SUMMARY
