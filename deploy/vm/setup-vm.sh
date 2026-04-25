#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash deploy/vm/setup-vm.sh
#
# Run this ON the VM (Ubuntu/Debian). It installs nginx and enables the site.

SITE_ROOT="/var/www/autoschool"
NGINX_SITE_NAME="autoschool"

sudo apt-get update -y
sudo apt-get install -y nginx

sudo mkdir -p "$SITE_ROOT"
sudo chown -R "$USER":"$USER" "$SITE_ROOT"

sudo cp "$(pwd)/deploy/vm/nginx-autoschool.conf" "/etc/nginx/sites-available/${NGINX_SITE_NAME}"
sudo ln -sf "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default || true

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "OK. Upload your built dist/ contents to: ${SITE_ROOT}"

