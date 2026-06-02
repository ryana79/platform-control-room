#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
conftest test policy/conftest/examples/good-workload.yaml --policy policy/conftest
! conftest test policy/conftest/examples/bad-workload.yaml --policy policy/conftest
