#!/bin/sh
set -eu
olympia_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
export RENDER_CLI_CONFIG_PATH="$olympia_root/.render-local/cli.yaml"
exec "$olympia_root/.render-local/render" "$@"
