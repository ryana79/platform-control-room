#!/usr/bin/env bash
set -euo pipefail

if ! command -v az >/dev/null 2>&1; then
  echo "Required command not found: az" >&2
  exit 1
fi

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
SCOPE="/subscriptions/$SUBSCRIPTION_ID"

echo "Azure account"
az account show --query "{name:name, subscription:id, tenant:tenantId, user:user.name}" -o table

echo
echo "Azure Resource Graph sample"
az extension add --name resource-graph --yes >/dev/null
az graph query \
  -q "Resources | summarize count() by type | order by count_ desc" \
  --first 10 \
  -o table

echo
echo "Azure Cost Management month-to-date sample"
az costmanagement query \
  --scope "$SCOPE" \
  --type ActualCost \
  --timeframe MonthToDate \
  --dataset '{"granularity":"None","aggregation":{"totalCost":{"name":"PreTaxCost","function":"Sum"}}}' \
  -o table || {
    echo "Cost Management returned no data or is unavailable for this subscription yet."
  }
