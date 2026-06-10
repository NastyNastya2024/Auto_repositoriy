#!/usr/bin/env bash
set -euo pipefail

# Deploys Expo web build to a VM via rsync over SSH.
#
# Usage (OS Login, Yandex Cloud):
#   VM_HOST=89.169.162.106 VM_USER=eduardnuzhdin VM_OS_LOGIN=eduardnuzhdin bash deploy/vm/deploy-to-vm.sh
#
# Usage (regular SSH key):
#   VM_HOST=1.2.3.4 VM_USER=ubuntu VM_SSH_KEY=~/.ssh/id_ed25519 bash deploy/vm/deploy-to-vm.sh
#
# Optional:
#   VM_SITE_ROOT=/var/www/autoschool
#   VM_CERT_DIR=~/.ssh/yc-cert

VM_HOST="${VM_HOST:?Set VM_HOST (public IP or hostname)}"
VM_USER="${VM_USER:-ubuntu}"
VM_SSH_KEY="${VM_SSH_KEY:-}"
VM_OS_LOGIN="${VM_OS_LOGIN:-}"
VM_CERT_DIR="${VM_CERT_DIR:-$HOME/.ssh/yc-cert}"
VM_SITE_ROOT="${VM_SITE_ROOT:-/var/www/autoschool}"

SSH_OPTS=()
RSYNC_SSH="ssh"

if [[ -n "$VM_OS_LOGIN" ]]; then
  mkdir -p "$VM_CERT_DIR"
  echo "Exporting OS Login certificate for ${VM_OS_LOGIN}..."
  yc compute ssh certificate export --directory "$VM_CERT_DIR" --login "$VM_OS_LOGIN"

  CERT_FILE=""
  for candidate in "$VM_CERT_DIR"/yc-cloud-id-*-"${VM_OS_LOGIN}"; do
    if [[ -f "$candidate" ]]; then
      CERT_FILE="$candidate"
      break
    fi
  done

  if [[ -z "$CERT_FILE" ]]; then
    echo "ERROR: OS Login certificate not found in ${VM_CERT_DIR}"
    exit 1
  fi

  SSH_COMMON=(-i "$CERT_FILE" -o "CertificateFile=${CERT_FILE}-cert.pub" -o IdentitiesOnly=yes)
  SSH_OPTS=("${SSH_COMMON[@]}")
  RSYNC_SSH="ssh ${SSH_COMMON[*]}"
elif [[ -n "$VM_SSH_KEY" ]]; then
  SSH_OPTS+=("-i" "$VM_SSH_KEY")
  RSYNC_SSH="ssh -i ${VM_SSH_KEY}"
fi

echo "Building web..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
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
