# CID SHS Portal

Monorepo with two apps at the repository root:

- **`frontend/`** — React (Vite) SPA
- **`backend/`** — Express API (MySQL)

## Prerequisites

- Node.js 16+
- MySQL (e.g. XAMPP)

## Setup

```bash
npm run install:all
```

Copy environment templates and edit values:

- `backend/.env` — from `backend/.env.example` (database, JWT, mail, `PORT`, etc.)
- `frontend/.env` — optional; see `frontend/.env.example` for `VITE_*` variables

Import schema (adjust user/password):

```bash
mysql -u root -p < backend/database/shs.sql
```

## Development

Run API and Vite together:

```bash
npm run dev
```

Or separately:

```bash
npm run backend
npm run frontend
```

- Frontend dev server: Vite default (often http://localhost:5173)
- API: `PORT` in `backend/.env` (default 5000)

The frontend proxies `/api` and `/uploads` to the API (see `frontend/vite.config.js`).

## Production build

```bash
npm run build
```

Outputs static assets under `frontend/dist/`. Serve that folder with your web server and run the Node process from `backend/` (`npm start --prefix backend`).

## Maintenance scripts

CLI helpers live under `backend/scripts/` (e.g. create admin: `node backend/scripts/create-admin.js`).

## Tests

```bash
npm test
```
