# Well Land Ops v2.0

Operations management platform for **Antrac Holding Group / Well Land** — covering fleet, procurement, vessels, staff, inventory, compliance, rentals, and reporting.

---

## Architecture

```
WL OPS - for claude/
├── wl-local-app/          ← Node.js + Express API (port 8787)
│   ├── server.js          ← Main Express server
│   ├── routes/            ← auth.js, data.js, stats.js
│   ├── middleware/        ← auth.js (JWT verification)
│   ├── db/                ← pool.js, schema.js, migrate.js, seedUsers.js
│   └── .env               ← Secrets (not in git)
└── wl-ops-frontend/       ← React + Vite frontend
    ├── src/
    │   ├── pages/         ← Dashboard, Fleet, Vessels, Staff, CRM, ...
    │   ├── components/    ← GlobalSearch, etc.
    │   ├── layouts/       ← MainLayout (sidebar + nav)
    │   ├── services/      ← api.js (Axios + JWT)
    │   └── lib/           ← accessControl, pdfGenerator, excelExport
    └── dist/              ← Built frontend (served by backend)
```

---

## First-Time Setup

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ LTS | https://nodejs.org |
| PostgreSQL | 14+ | https://www.postgresql.org/download/windows/ |

### Steps

```cmd
1. Run SETUP.cmd          (installs deps, creates DB, migrates data, seeds users)
2. Edit wl-local-app\.env (set DB_PASSWORD and JWT_SECRET)
3. Run START.cmd           (builds frontend, starts server)
4. Open http://localhost:8787
```

Or manually:

```cmd
:: Install backend
cd wl-local-app
npm install

:: Copy and edit env
copy .env.example .env
:: Edit .env with your PostgreSQL password and a strong JWT secret

:: Create database (run in psql or pgAdmin)
CREATE DATABASE wl_ops;

:: Create schema
node db/schema.js

:: Migrate existing data (if you have db.json)
node db/migrate.js

:: Seed user accounts
node db/seedUsers.js

:: Install frontend
cd ..\wl-ops-frontend
npm install
npm run build

:: Start server
cd ..\wl-local-app
node server.js
```

---

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `wlops2025` | HOD (full access) |
| `<staff-id>` | `<staff-id lowercase>` | Per designation |

**Change passwords immediately on first login** — use the "Change Password" option in the sidebar.

---

## Environment Variables

### `wl-local-app/.env`

```env
PORT=8787
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=wl_ops
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=long_random_string_min_32_chars
JWT_EXPIRY=12h

NODE_ENV=production
```

Generate a strong JWT secret:
```cmd
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Daily Use

| Script | Purpose |
|--------|---------|
| `START.cmd` | Build frontend + start production server |
| `START_DEV.cmd` | Hot-reload dev mode (two windows) |
| `STOP.cmd` | Stop all Node.js processes |

---

## SCM / Branch Policy

See [`.github/BRANCH_POLICY.md`](.github/BRANCH_POLICY.md)

**Branches:** `main` (production) → `develop` (integration) → `feature/*` / `fix/*`

---

## Features

- **Fleet** — vehicle/equipment registry, readiness, issues, service tracking
- **Vessels** — marine asset management with crew
- **Procurement** — multi-stage PR → RFQ → PO → Accounts → Delivered workflow
- **Inventory** — stock at multiple locations, GRN, transfers
- **Staff** — registry with permits, licenses, assignments
- **CRM** — rental agreements, clients, revenue tracking
- **SRM** — supplier register, quotes, catalog
- **Compliance** — permits, work permits, license expiry monitoring
- **Reports** — PDF generation (PR, RFQ, PO, GRN, Transfer Notes, Fleet)
- **Global Search** — `Ctrl+K` searches across all data
- **Excel Export** — one-click export on all major pages
- **PWA** — installable as a desktop/mobile app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3 (MD3 theme) |
| UI | Lucide icons, Framer Motion, Recharts, Sonner toasts |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL (JSONB storage) |
| Auth | bcryptjs + JSON Web Tokens |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| Routing | React Router 7 |

---

## Network Access

The backend binds to `0.0.0.0:8787` — accessible from any device on your local network.

Find your IP: `ipconfig` → look for IPv4 address (e.g. `192.168.1.100`)

Then open `http://192.168.1.100:8787` on tablets, phones, or other PCs on the same WiFi.

---

## Backup & Data

- **Automatic backups**: `POST /api/backup` creates a timestamped JSON snapshot in `wl-local-app/backups/`
- **Manual export**: `GET /api/export` (authenticated) downloads full JSON
- **PostgreSQL**: Use `pg_dump wl_ops > backup.sql` for full DB backup

---

*Well Land Ops v2.0 — Antrac Holding Group*
