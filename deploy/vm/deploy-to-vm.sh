#!/usr/bin/env bash
set -euo pipefail

# Deploys Expo web build to a VM via rsync over SSH.
#
# Usage:
#   VM_HOST=1.2.3.4 VM_USER=ubuntu bash deploy/vm/deploy-to-vm.sh
#
# Optional:
#   VM_SSH_KEY=~/.ssh/id_ed25519
#   VM_SITE_ROOT=/var/www/autoschool

VM_HOST="${VM_HOST:?Set VM_HOST (public IP or hostname)}"
VM_USER="${VM_USER:-ubuntu}"
VM_SSH_KEY="${VM_SSH_KEY:-}"
VM_SITE_ROOT="${VM_SITE_ROOT:-/var/www/autoschool}"

SSH_OPTS=()
RSYNC_SSH="ssh"
if [[ -n "$VM_SSH_KEY" ]]; then
  SSH_OPTS+=("-i" "$VM_SSH_KEY")
  RSYNC_SSH="ssh -i ${VM_SSH_KEY}"
fi

echo "Building web..."
npm ci
npx expo export -p web

if [[ ! -f "dist/index.html" ]]; then
  echo "ERROR: dist/index.html not found. Build failed?"
  exit 1
fi

echo "Uploading dist/ to ${VM_USER}@${VM_HOST}:${VM_SITE_ROOT} ..."
rsync -az --delete -e "${RSYNC_SSH}" \
  dist/ "${VM_USER}@${VM_HOST}:${VM_SITE_ROOT}/"

echo "Reloading nginx..."
ssh "${SSH_OPTS[@]}" "${VM_USER}@${VM_HOST}" "sudo nginx -t && sudo systemctl reload nginx"

echo "Done."

