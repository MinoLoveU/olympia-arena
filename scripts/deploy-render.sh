#!/bin/sh
set -eu
olympia_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec "$olympia_root/scripts/render.sh" deploys create srv-db0n277avr4c738f95hg --output json --confirm --wait "$@"
