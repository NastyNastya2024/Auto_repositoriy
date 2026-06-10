# Deploy to Yandex VM (Nginx)

This repo builds a static web bundle to `dist/` via Expo Web export. On a VM you only need Nginx to serve that folder.

## 1) VM prerequisites

- Ubuntu/Debian VM with a public IP
- SSH access (key-based)

## 2) Setup Nginx on the VM

Copy this repo (or at least `deploy/vm/`) to the VM, then run:

```bash
bash deploy/vm/setup-vm.sh
```

The website root will be:

```text
/var/www/autoschool
```

## 3) Deploy from your local machine

Run this on your **local Mac**, not inside the SSH session on the VM.

For Yandex Cloud VMs with OS Login enabled:

```bash
VM_HOST=<YOUR_VM_IP> VM_USER=<YOUR_OS_LOGIN_USER> VM_OS_LOGIN=<YOUR_OS_LOGIN_USER> bash deploy/vm/deploy-to-vm.sh
```

Example:

```bash
VM_HOST=89.169.162.106 VM_USER=eduardnuzhdin VM_OS_LOGIN=eduardnuzhdin bash deploy/vm/deploy-to-vm.sh
```

If you use a regular SSH key instead of OS Login:

```bash
VM_HOST=<YOUR_VM_IP> VM_USER=<YOUR_VM_USER> VM_SSH_KEY=~/.ssh/id_ed25519 bash deploy/vm/deploy-to-vm.sh
```

## Notes

- SPA routing is enabled via `try_files ... /index.html;`
- If you have a real backend API, add an extra `location /api/` proxy to `deploy/vm/nginx-autoschool.conf`.

