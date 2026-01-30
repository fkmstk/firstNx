#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_NAME="${APP_NAME:-firstNx}"

dist_dir="$ROOT_DIR/dist"
build_dir="$ROOT_DIR/build"
frontend_dist="$ROOT_DIR/../frontend/dist"

rm -rf "$dist_dir" "$build_dir"

if [[ ! -d "$frontend_dist" ]]; then
  echo "frontend dist not found: $frontend_dist" >&2
  echo "Run 'pnpm build' in ../frontend first." >&2
  exit 1
fi

"$PYTHON_BIN" -m PyInstaller \
  --onefile \
  --windowed \
  --name "$APP_NAME" \
  --add-data "$frontend_dist:frontend_dist" \
  --collect-all polars \
  --collect-all pyarrow \
  --collect-all sklearn \
  --collect-all numpy \
  --collect-all pandas \
  app/run_server.py

echo "Built: $dist_dir/$APP_NAME.app"
