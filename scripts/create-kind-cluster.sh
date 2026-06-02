#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
kind create cluster --name azureplatform || true
kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -
