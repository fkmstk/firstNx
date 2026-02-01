#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_NAME="${APP_NAME:-firstNx}"
ONEFILE="${ONEFILE:-0}"
PYINSTALLER_CONFIG_DIR="${PYINSTALLER_CONFIG_DIR:-$ROOT_DIR/.pyinstaller}"
PYINSTALLER_CACHE_DIR="${PYINSTALLER_CACHE_DIR:-$PYINSTALLER_CONFIG_DIR/cache}"

dist_dir="$ROOT_DIR/dist"
build_dir="$ROOT_DIR/build"
frontend_dist="$ROOT_DIR/../frontend/dist"

rm -rf "$dist_dir" "$build_dir"
mkdir -p "$PYINSTALLER_CONFIG_DIR" "$PYINSTALLER_CACHE_DIR"
export PYINSTALLER_CONFIG_DIR
export PYINSTALLER_CACHE_DIR

if [[ ! -d "$frontend_dist" ]]; then
  echo "frontend dist not found: $frontend_dist" >&2
  echo "Run 'pnpm build' in ../frontend first." >&2
  exit 1
fi

if [[ "$ONEFILE" == "1" ]]; then
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
else
  "$PYTHON_BIN" -m PyInstaller \
    --windowed \
    --name "$APP_NAME" \
    --add-data "$frontend_dist:frontend_dist" \
    --collect-all polars \
    --collect-all pyarrow \
    --collect-all sklearn \
    --collect-all numpy \
    --collect-all pandas \
    app/run_server.py
fi

echo "Built: $dist_dir/$APP_NAME.app"
