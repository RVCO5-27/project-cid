# Installation & Verification Checklist

Use this checklist to verify your reorganized project is set up correctly.

## ✓ Pre-Installation Checks

- [ ] Node.js 16+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] MySQL running: `mysql -u root -p -e "SELECT 1;"`
- [ ] Repository layout is `frontend/`, `backend/`, plus root `README.md` and tooling files

## ✓ Directory Structure Verification

### Root Level
```
✓ frontend/                    (React/Vite frontend)
✓ backend/                    (Express backend)
✓ scripts/                   (Utility scripts)
✓ docs/                      (Documentation)
✓ package.json               (Root dev scripts)
✓ .env.example              (Environment template)
✓ MIGRATION_SUMMARY.md      (This reorganization)
✓ REORGANIZATION_GUIDE.md   (Setup guide)
```

### Frontend folder
```
✓ frontend/src/                (React source code)
✓ frontend/public/             (Static assets)
✓ frontend/package.json        (Frontend dependencies)
✓ frontend/vite.config.js      (Vite config with API proxy)
✓ frontend/.env.example       (Frontend env template)
```

### Backend folder
```
✓ backend/server.js           (Express app entry point)
✓ backend/config/db.js        (Database connection)
✓ backend/routes/             (API routes)
✓ backend/controllers/        (Business logic)
✓ backend/middleware/         (Express middleware)
✓ backend/services/           (Business services)
✓ backend/database/           (Schema & migrations)
✓ backend/uploads/            (User uploads)
✓ backend/package.json        (Backend dependencies)
✓ backend/.env                (Backend env variables)
✓ backend/.env.example       (Environment template)
```

- [ ] All directories present
- [ ] No duplicate node_modules at root level

## ✓ Installation Steps

### Step 1: Install Root Dev Dependencies
```bash
cd c:\xampp\htdocs\project
npm install
```
Expected: `concurrently` installed in `node_modules/`
- [ ] Command succeeded without errors
- [ ] `npm run dev` command is available

### Step 2: Install Client Dependencies
```bash
npm install --prefix frontend
```
Expected: ~500+ packages (vite, react, axios, bootstrap, etc.)
- [ ] No `npm ERR!` messages
- [ ] `frontend/node_modules/` created
- [ ] `frontend/package-lock.json` generated

### Step 3: Install Server Dependencies
```bash
npm install --prefix backend
```
Expected: ~100+ packages (express, mysql2, nodemon, etc.)
- [ ] No `npm ERR!` messages
- [ ] `backend/node_modules/` created
- [ ] `backend/package-lock.json` generated

## ✓ Environment Configuration

### Step 1: Create Root .env
```bash
copy .env.example .env
```
- [ ] `.env` file created (Windows: copy, Linux/Mac: cp)

### Step 2: Edit .env with MySQL Credentials
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your-password>
DB_NAME=shs
PORT=5000
JWT_SECRET=<32+ random characters>
```
- [ ] All database credentials filled in
- [ ] Port and JWT_SECRET configured

### Step 3: (Optional) Create Server .env
```bash
cd backend
copy .env.example .env
```
- [ ] backend/.env created (same settings as root)

## ✓ Database Setup

### Step 1: Create Database
```bash
mysql -u root -p < backend/database/shs.sql
```
- [ ] No errors in console
- [ ] Database `shs` created

### Step 2: Verify Database
```bash
mysql -u root -p -e "USE shs; SHOW TABLES;" | head -10
```
- [ ] Should show tables: admins, audit_logs, etc.
- [ ] At least 5+ tables present

### Step 3: Test Connection
```bash
cd backend
node -e "require('dotenv').config(); const db = require('./config/db'); db.testConnection().then(() => process.exit(0))"
```
- [ ] Output shows: `[DB] ✓ Connection successful`

## ✓ Development Server Startup

### Step 1: Start Both Servers
From project root:
```bash
npm run dev
```

Expected terminal output:
```
> concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"

[0] npm run dev --prefix backend
[1] npm run dev --prefix frontend
[0] ...listening on http://localhost:5000
[1]   VITE v... ready in ... ms
[1]   ➜  Local:   http://localhost:5173/
```

- [ ] Both servers started without errors
- [ ] Frontend running on http://localhost:5173
- [ ] Backend running on http://localhost:5000
- [ ] No "Port already in use" errors

### Step 2: Verify Backend
In another terminal:
```bash
curl http://localhost:5000/api/ping
```
Expected response:
```json
{"status":"ok"}
```
- [ ] Returns `{"status":"ok"}`
- [ ] No connection refused errors

### Step 3: Open Frontend in Browser
Visit: http://localhost:5173

- [ ] Page loads without errors
- [ ] No 404 errors in console
- [ ] No network request failures

## ✓ API Communication Test

### From Browser Console (http://localhost:5173):
```javascript
fetch('/api/ping').then(r => r.json()).then(console.log)
```

Expected:
```
{Object} { status: "ok" }
```

- [ ] API call succeeds
- [ ] Response shows `status: ok`
- [ ] No CORS errors in console

## ✓ Package.json Scripts Verification

### From project root, test each script:

```bash
npm run frontend        # Should start Vite on :5173
npm run backend        # Should start Express on :5000
npm run dev          # Should start both with concurrently
npm run build        # Builds frontend (Vite)
```

- [ ] `npm run frontend` works
- [ ] `npm run backend` works
- [ ] `npm run dev` works with both servers
- [ ] `npm run build` succeeds (if tested)

## ✓ Common Port Issues (if needed)

If ports 5000 or 5173 are in use:

### Find Process (Windows)
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

### Kill Process (Windows)
```bash
taskkill /PID <PID> /F
```

### Alternative: Change Ports
**For server:** Edit `backend/.env`
```
PORT=5001  # Change from 5000 to 5001
```

**For client:** Edit `frontend/vite.config.js`
```javascript
server: {
  port: 3000  // Change from 5173 to 3000
}
```

Then update the proxy target in vite.config.js to match.

- [ ] Identified any port conflicts
- [ ] Resolved port issues (or documented for later)

## ✓ Import/Path Verification

### Check Client Imports
```bash
cd frontend
grep -r "from.*cid-shs-portal" src/ 2>nul || echo "No problematic imports found"
```
- [ ] No hardcoded `cid-shs-portal` paths
- [ ] All imports use relative paths (./,../,@/)

### Check Server Requires
```bash
cd ..\backend
findstr /R /S "require.*cid-shs-portal" *.js routes\*.js 2>nul || echo "No problematic paths found"
```
- [ ] No hardcoded `cid-shs-portal` paths
- [ ] All requires use relative paths

## ✓ Final Verification Checklist

- [ ] All directories created and populated
- [ ] npm dependencies installed (root + frontend + backend)
- [ ] .env file created and configured with database credentials
- [ ] Database created and schema applied
- [ ] Database connection test successful
- [ ] `npm run dev` starts both frontend and backend
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend accessible at http://localhost:5000/api/ping
- [ ] API calls from frontend to backend work
- [ ] No CORS errors in browser console
- [ ] No import/require errors in console or terminal

## ✓ Troubleshooting Quick Reference

| Problem | Solution | Check |
|---------|----------|-------|
| `Cannot find module` | Run `npm install --prefix <frontend|backend>` | Module exists in node_modules |
| Port already in use | Kill process or change port in .env/vite.config.js | New port works |
| Database connection fails | Check .env credentials, verify MySQL running | `mysql -u root -p -e "SELECT 1;"` |
| CORS errors | Check FRONTEND_ORIGIN in .env | Browser console, Network tab |
| Frontend can't reach API | Verify both servers running, check proxy config | `curl http://localhost:5000/api/ping` |
| Files not found | Run from correct directory | `pwd` or `cd` to project root |

## ✓ Next Steps After Verification

1. **If all checks pass:**
   - Start implementing features
   - Review docs/ for system documentation
   - Check admin setup: `node scripts/create-admin.js`

2. **If issues found:**
   - Check browser console for errors
   - Check terminal output for exceptions
   - Review error messages in MIGRATION_SUMMARY.md
   - Try troubleshooting commands above
   - Review REORGANIZATION_GUIDE.md for detailed setup

3. **Ready for development:**
   - `npm run dev` to start
   - Edit frontend/ code for frontend changes
   - Edit backend/ code for backend changes
   - Changes hot-reload automatically in dev mode

---

**Estimated Time:** 15-30 minutes  
**Success Indicator:** Both servers running, frontend loads, API returns `{"status":"ok"}`

