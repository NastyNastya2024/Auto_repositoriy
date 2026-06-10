#!/usr/bin/env bash
set -euo pipefail

# Installs Node.js (if missing), API dependencies, and systemd unit.
# Run ON the VM from the repo root after git pull / rsync.
#
# Usage:
#   JWT_SECRET='long-random-secret' bash deploy/vm/setup-api.sh

APP_ROOT="${APP_ROOT:-$(pwd)}"
DEPLOY_USER="${DEPLOY_USER:-$USER}"
JWT_SECRET="${JWT_SECRET:?Set JWT_SECRET (long random string)}"

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

cd "${APP_ROOT}/server"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
mkdir -p data

UNIT_DST="/etc/systemd/system/autoschool-api.service"
sudo sed \
  -e "s|__DEPLOY_USER__|${DEPLOY_USER}|g" \
  -e "s|__APP_ROOT__|${APP_ROOT}|g" \
  -e "s|__JWT_SECRET__|${JWT_SECRET}|g" \
  "${APP_ROOT}/deploy/vm/autoschool-api.service" | sudo tee "${UNIT_DST}" >/dev/null

sudo systemctl daemon-reload
sudo systemctl enable autoschool-api
sudo systemctl restart autoschool-api
sudo systemctl --no-pager status autoschool-api

echo "API OK at http://127.0.0.1:3001/api/health"
