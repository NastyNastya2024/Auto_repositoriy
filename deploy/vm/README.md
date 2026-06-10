# Deploy to Yandex VM (Nginx + API)

This repo builds a static web bundle to `dist/` via Expo Web export. The VM serves the frontend with Nginx and runs a Node.js API (`server/`) for shared data (заявки, записи, чаты).

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

The deploy script:

1. Builds `dist/` and uploads to `/var/www/autoschool`
2. Uploads `server/` to `~/autoschool-app/server/` on the VM
3. Installs API dependencies and restarts `autoschool-api` systemd service
4. Updates Nginx config (proxies `/api/` → `localhost:3001`)

## 4) Local development

Terminal 1 — API:

```bash
npm run api
```

Terminal 2 — Expo web (API on same machine):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001 npm run web
```

Default admin login after first API start: `admin` / `admin123`

## Architecture

| Layer | Role |
|-------|------|
| `dist/` (Nginx) | React web UI |
| `server/` (Node, port 3001) | REST API, SQLite DB |
| `/api/*` | Nginx reverse proxy to API |

All users share one SQLite database on the server. **Every mutation** goes through `POST /api/actions`; the client never writes business data to localStorage (only the auth JWT token).

| Data | Server action | Sync |
|------|---------------|------|
| Заявки на доступ | `submitRegistrationRequest` | immediate + poll 5s |
| Заявки на тариф | `submitStudentTariffRequest` | immediate + poll |
| Расписание / слоты | `addSlot`, `addBlockedSlot`, `ensureFreeTemplateSlotsForWeek`, `removeSlot`, `updateSlotStatus` | immediate + poll |
| Записи на занятия | `bookLessonSlot`, `adminBookStudentSlot`, `setBookingStatus`, … | immediate + poll |
| Чаты | `sendMessage` | immediate + poll + refresh on screen focus |
| Ученики / тарифы | `addUser`, `upsertTariff`, … | immediate + poll |

Admin sees the full database; students receive a filtered view (own chats, own bookings, shared schedule).

## Notes

- SPA routing: `try_files ... /index.html;`
- API health check: `GET /api/health`
- DB file: `~/autoschool-app/server/data/autoschool.db` on VM
- Set a strong `JWT_SECRET` on the VM (deploy script generates one on first run)
