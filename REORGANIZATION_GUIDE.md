# CID SHS Portal - Reorganized Project Structure

## Overview

This project has been reorganized into a clean, modular structure with:
- **frontend/** - React frontend (Vite)
- **backend/** - Node.js/Express backend  
- Maintenance CLI scripts live under **backend/scripts/**
- Extra markdown guides may live at repo root

## Project Structure

```
project/
├── frontend/                    # React frontend (Vite)
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API and utility services
│   │   ├── context/           # React context (auth, etc.)
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # Global styles
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static files
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration (with API proxy)
│   └── .env.example           # Environment variables template
│
├── backend/                    # Node.js/Express backend
│   ├── config/                # Configuration files
│   │   └── db.js              # Database connection
│   ├── routes/                # API route handlers
│   ├── controllers/           # Business logic
│   ├── middleware/            # Express middleware
│   ├── services/              # Business services
│   ├── database/              # Database migrations & schema
│   ├── scripts/               # Database setup, utilities
│   ├── uploads/               # User-uploaded files (gitignored)
│   ├── package.json           # Backend dependencies
│   ├── server.js              # Express app entry point
│   ├── .env                   # Environment variables (gitignored)
│   └── .env.example           # Environment variables template
│
├── package.json               # Thin orchestration (concurrently dev/install)
├── .gitignore
├── README.md                  # Quick start
└── *.md                       # Optional historical guides
```

## Quick Start

### 1. Install Dependencies

```bash
npm install                    # Install root dev dependencies (concurrently)
npm install --prefix frontend   # Install frontend dependencies
npm install --prefix backend   # Install backend dependencies
```

Or all at once:
```bash
npm run install:all
```

### 2. Configure Environment Variables

**Root level (.env):**
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and other settings
```

**Server level (optional, for direct server runs):**
```bash
cd backend
cp .env.example .env
# Edit backend/.env as needed
```

**Client level (optional):**
```bash
cd frontend
cp .env.example .env.local
# Edit if you need custom API settings
```

### 3. Database Setup

1. **Create MySQL database** from the schema:
   ```bash
   mysql -u root -p < backend/database/shs.sql
   ```

2. **Run migrations** (automatic on server start):
   - The server will apply migrations from `backend/database/migrations/` on startup
   - Check console output for migration results

### 4. Start Development Environment

**Option A: Run both client and server together**
```bash
npm run dev
```
This uses `concurrently` to run:
- Frontend Vite dev server on `http://localhost:5173`
- Express backend on `http://localhost:5000`

**Option B: Run separately**
```bash
npm run frontend          # Frontend only on port 5173
npm run backend          # Backend only on port 5000
```

### 5. Verify Setup

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/ping → `{ "status": "ok" }`

## Key Configurations

### Client ↔ Server Communication

**Development (Vite Proxy):**
- Client makes requests to same-origin `/api/*`
- Vite dev server (port 5173) proxies requests to Express (port 5000)
- Configured in `frontend/vite.config.js`

**Production:**
- Frontend is built (`npm run build --prefix frontend`) → `frontend/dist/`
- Client requests go to `{VITE_API_ORIGIN}/api` (or same-origin if not set)
- Express serves static frontend files and API endpoints

**CORS:**
- Backend allows origins from `FRONTEND_ORIGIN` env var
- Default: `http://localhost:5173, http://localhost:5174, http://localhost, http://127.0.0.1`
- Update `backend/server.js` `getCorsAllowedOrigins()` for production domains

### Database Connection

- File: `backend/config/db.js`
- Library: `mysql2/promise` (connection pooling)
- Credentials from environment variables:
  - `DB_HOST` (default: localhost)
  - `DB_PORT` (default: 3306)
  - `DB_USER` (default: root)
  - `DB_PASSWORD` (default: empty)
  - `DB_NAME` (default: shs)

## Scripts Reference

### Root Scripts
```bash
npm run dev              # Start frontend and backend together (concurrently)
npm run frontend          # Start frontend Vite dev server only
npm run backend          # Start backend Express server only
npm run build            # Build frontend for production
npm run test             # Run backend and frontend tests
npm run install:all     # Install all dependencies
npm start                # Start production API (backend only)
```

### Server Scripts
```bash
cd backend
npm run dev            # Start with nodemon (auto-reload)
npm start              # Start production server
npm test               # Run tests
```

### Client Scripts
```bash
cd frontend
npm run dev           # Start Vite dev server
npm run build         # Build for production → frontend/dist/
npm run preview       # Preview production build
```

### Utility Scripts
```bash
cd backend
node backend/scripts/create-admin.js              # Create admin account
node backend/scripts/reset-admin-password.js      # Reset password
node backend/scripts/check-admin-accounts.js      # List all admins
node backend/scripts/test-login-flow.js           # Test login system
```

## Troubleshooting

### Port Already in Use
If port 5173 or 5000 is already in use:
```bash
# Kill process on Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change ports in:
# - frontend/vite.config.js (server.port)
# - backend/.env (PORT variable)
```

### Database Connection Failed
- Verify MySQL is running: `mysql -u root -p -e "SELECT 1;"`
- Check `.env` credentials match your MySQL setup
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Frontend Can't Reach Backend
- Verify `npm run dev` shows both servers starting
- Check `frontend/vite.config.js` proxy config
- Ensure backend is running on port 5000
- Check browser console for CORS errors

### Migrations Not Running
- Check `backend/database/migrations/` folder exists with .sql files
- Review server console output on startup
- Manual run: `node backend/database/runMigrations.js`

## Environment Variables Reference

See `.env.example` files in each directory for complete documentation.

**Critical for dev:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (generate a random 32+ char string)
- `PORT` (for backend, default 5000)

**Optional:**
- `VITE_PROXY_TARGET` (Vite dev proxy target, default http://127.0.0.1:5000)
- `FRONTEND_ORIGIN` (backend CORS, comma-separated)
- `VITE_LOCAL_HTTPS` (enable local HTTPS in Vite)

## Files Moved During Reorganization

### From `cid-shs-portal/frontend` → `frontend/`
- All React source files and components
- Vite configuration
- package.json and node_modules

### From `cid-shs-portal/backend` → `backend/`
- All Express routes, controllers, middleware
- server.js entry point
- package.json, config/, database/ folders
- node_modules (if present)

### From `cid-shs-portal/database` → `backend/database`
- shs.sql schema file
- Migration files in migrations/ folder

### From root `scripts/` → `backend/scripts/`
- All utility and maintenance scripts (21 total)
- Run from repo root: `node backend/scripts/<script-name>.js`

### Documentation
- Historical guides remain as `.md` files at repo root; see README.md first

## Next Steps

1. ✓ Structure reorganized (frontend/ and backend/)
2. ✓ Environment variables configured (.env files)
3. ✓ Database connection ready (backend/config/db.js)
4. ✓ Vite proxy configured for API calls
5. Next: Run `npm install` → `npm run dev` → Test in browser
6. Next: Implement any additional features or customizations
7. Next: Deploy to production (see PRODUCTION_DEPLOYMENT docs)

## Support & Documentation

Additional detail may appear in markdown files at the repo root:
- [Installation Guide](./docs/INSTALLATION.md)
- [Admin Authentication & Login](./docs/ADMIN-AUTH-AND-LOGIN.md)
- [Audit System Master Guide](./docs/AUDIT_SYSTEM_MASTER_GUIDE.md)
- [Phase 2 & 3 Implementation Guides](./docs/)

## Appendix: Removed/Archived

The following were identified as duplicates or no longer needed:
- Old markdown reports consolidated or removed
- Duplicate node_modules (cleaned up)
- Backup .zip files
- Unrelated dotenv configs

All critical code is preserved in `frontend/` and `backend/`.
