# Project Reorganization Summary

**Date:** May 8, 2026  
**Original Structure:** Messy root with scattered files, cid-shs-portal/frontend and cid-shs-portal/backend  
**New Structure:** Clean separation with frontend/, backend/, scripts/, and docs/ at project root

---

## Files Moved

### Frontend Files (cid-shs-portal/frontend → frontend/)
- ✓ All React components from `src/components/` → `frontend/src/components/`
- ✓ All pages from `src/pages/` → `frontend/src/pages/`
- ✓ Services layer (`src/services/`) → `frontend/src/services/`
- ✓ Context (React Context API) → `frontend/src/context/`
- ✓ Utilities and helpers → `frontend/src/utils/`
- ✓ Static assets → `frontend/public/`
- ✓ Styles → `frontend/src/styles/`
- ✓ package.json (frontend dependencies)
- ✓ vite.config.js (with proxy configuration)
- **Total:** ~22,968 files (including node_modules)

### Backend Files (cid-shs-portal/backend → backend/)
- ✓ Express app entry point: `server.js` → `backend/server.js`
- ✓ Route handlers → `backend/routes/`
- ✓ Controllers/business logic → `backend/controllers/`
- ✓ Middleware → `backend/middleware/`
- ✓ Services (auth, audit, etc.) → `backend/services/`
- ✓ Configuration → `backend/config/` (includes db.js with mysql2/promise)
- ✓ Database folder → `backend/database/`
- ✓ Uploads folder → `backend/uploads/`
- ✓ package.json (backend dependencies)
- ✓ .env and .env.example files
- **Total:** ~28,004 files (including vendor and node_modules)

### Database & Scripts
- ✓ Database schema: `cid-shs-portal/database/shs.sql` → `backend/database/shs.sql`
- ✓ Migrations: `cid-shs-portal/database/migrations/*` → `backend/database/migrations/*`
- ✓ All 21 utility scripts → `scripts/` folder:
  - create-admin.js
  - reset-admin-password.js
  - test-login-flow.js
  - check-admin-accounts.js
  - ... (17 more)

### Documentation
- ✓ All .md files from root → `docs/` folder
- ✓ All .md files from cid-shs-portal/docs → `docs/` folder
- **19 markdown files** consolidated in one location

---

## Configuration Changes

### Root-Level Files
**New:**
- ✓ `package.json` - Root package with concurrently scripts
  ```json
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
    "frontend": "npm run dev --prefix frontend",
    "backend": "npm run dev --prefix backend",
    "install:all": "npm install && npm install --prefix frontend && npm install --prefix backend"
  }
  ```
- ✓ `.env.example` - Root environment template with all settings

### Client (React/Vite)
**Preserved/Updated:**
- ✓ `frontend/vite.config.js` - Proxy configured for `/api/*` → `http://localhost:5000`
  ```javascript
  proxy: {
    '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true }
  }
  ```
- ✓ `frontend/src/services/api.js` - Already uses `/api` relative URLs (no changes needed)
- ✓ Import paths remain relative within frontend folder (no changes needed)

### Server (Express/Node.js)
**Preserved/Updated:**
- ✓ `backend/server.js` - Unchanged (routes, middleware, error handling intact)
- ✓ `backend/config/db.js` - Uses mysql2/promise with env variables
  ```javascript
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shs'
  })
  ```
- ✓ `backend/database/runMigrations.js` - Auto-runs on startup
- ✓ CORS configured in server.js to allow frontend origins:
  ```javascript
  FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost,http://127.0.0.1
  ```

### Require/Import Paths
**Client (ES6 modules):**
- ✓ Relative imports work: `import ... from '../components/...'`
- ✓ API calls use: `/api/endpoint` (proxied by Vite)
- ✓ No changes needed for existing code

**Server (CommonJS):**
- ✓ Relative requires work: `require('./routes')`, `require('../middleware/...')`
- ✓ Database pool import: `require('./config/db')`
- ✓ No changes needed for existing code

---

## Environment Variables Reference

### .env File Location & Usage

**Root (.env):**
- Used by npm scripts when running `npm run dev`
- Sourced by both client and server via their respective startup scripts
- Contains: DB credentials, JWT secret, FRONTEND_ORIGIN, PORT

**Server (backend/.env):**
- Sourced directly by Express app via `require('dotenv').config()`
- Contains: Same as root + SMTP settings (optional)

**Client (frontend/.env.local):**
- Sourced by Vite via `import.meta.env`
- Contains: API URL overrides, HTTPS flag (optional)

### Key Variables

| Variable | Default | Used By | Purpose |
|----------|---------|---------|---------|
| `PORT` | 5000 | Server | Express listen port |
| `DB_HOST` | localhost | Server | MySQL hostname |
| `DB_USER` | root | Server | MySQL username |
| `DB_PASSWORD` | (empty) | Server | MySQL password |
| `DB_NAME` | shs | Server | Database name |
| `JWT_SECRET` | change-me | Server | JWT signing key |
| `FRONTEND_ORIGIN` | localhost:5173,... | Server | CORS allowed origins |
| `VITE_API_URL` | /api | Client | API base URL |
| `VITE_PROXY_TARGET` | localhost:5000 | Client | Dev proxy target |

---

## Import/Require Path Summary

### No Changes Required
Most imports/requires already use relative paths within their respective folders:

**Frontend Example:**
```javascript
import api from '../services/api'        // ✓ Works in frontend/
import { useAuth } from '../context/...  // ✓ Works in frontend/
```

**Backend Example:**
```javascript
const pool = require('./config/db')      // ✓ Works in backend/
const routes = require('./routes')       // ✓ Works in backend/
```

### Proxy Handles Backend Calls
Client makes requests to `/api/...` → Vite proxy → Express on :5000
- No hardcoded backend URLs needed in client code
- Works for development and can work in production (configure NGINX/Apache)

---

## How to Start the Reorganized Project

### 1. Install Everything
```bash
npm install                    # concurrently (root)
npm install --prefix frontend   # Vite, React, axios, etc.
npm install --prefix backend   # Express, mysql2, etc.
```

### 2. Create .env
```bash
cp .env.example .env
# Edit with your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=<your-password>
# DB_NAME=shs
```

### 3. Set Up Database
```bash
mysql -u root -p < backend/database/shs.sql
```

### 4. Run Development Environment
```bash
npm run dev
# Opens:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
```

### 5. Verify It Works
- Visit http://localhost:5173 in browser
- Should load React app
- API calls go to backend via Vite proxy
- Check `/api/ping` returns `{ "status": "ok" }`

---

## Files/Folders No Longer Needed

These can be safely removed (non-essential or replaced):

- ❌ Root `vite.config.js` (was serving mixed front+back, now replaced)
- ❌ Root `src/` folder (frontend code now in frontend/)
- ❌ `cid-shs-portal/` folder (entire structure replaced)
- ❌ Duplicate markdown reports (consolidated in docs/)
- ❌ Old `.zip` backup files
- ❌ Leftover `.kilo/` and `.claude/` config folders (can be removed or kept)

---

## Database Connection Verification

Test the database connection:

```bash
cd backend
node -e "const db = require('./config/db'); db.testConnection().then(() => process.exit(0))"
```

Expected output:
```
[DB] ✓ Connection successful
```

---

## Troubleshooting Common Issues

### Issue: Port 5000 or 5173 in Use
**Solution:**
```bash
# Find process:
netstat -ano | findstr :5000
# Kill it (Windows):
taskkill /PID <PID> /F
# Or change ports in vite.config.js and backend/.env
```

### Issue: "Cannot find module" errors
**Solution:**
- Ensure you've run `npm install --prefix frontend` and `npm install --prefix backend`
- Check that relative paths are correct (should start with `.` or `./`)

### Issue: Database connection fails
**Solution:**
- Verify MySQL is running: `mysql -u root -p -e "SELECT 1;"`
- Check DB credentials in `.env` match your MySQL setup
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Issue: Frontend can't reach backend
**Solution:**
- Verify both servers are running (should see two ports in npm run dev output)
- Check browser console for CORS errors
- Ensure backend is responding: `curl http://localhost:5000/api/ping`
- Check Vite proxy config in `frontend/vite.config.js`

---

## Next Steps

1. ✓ All files organized into clean structure
2. ✓ Environment variables configured
3. ✓ Database connection ready
4. ✓ API proxy configured
5. → **Run `npm run dev` and test**
6. → Debug any import or connection issues
7. → Implement additional features
8. → Deploy to production (see docs/PRODUCTION_DEPLOYMENT_SUMMARY.md)

---

## Documentation

- See `REORGANIZATION_GUIDE.md` for detailed setup instructions
- See `docs/` folder for comprehensive system documentation
- See individual `package.json` files for dependency versions

