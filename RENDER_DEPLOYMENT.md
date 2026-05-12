# Render Deployment Configuration Guide

## Updated Configuration Files

This guide outlines the configuration changes made for deploying your Project CID to Render.com.

### 1. Files Created/Updated

#### `render.yaml` (Root Level)
- Defines three services: MySQL (private), Backend (Node.js), and Frontend (Static)
- MySQL uses a private Docker service with persistent storage
- Backend connects to MySQL using the service name `mysql` as hostname
- Frontend serves the Vite build output

#### `backend/.env` (Updated)
- **DB Configuration for Render:**
  - `DB_HOST=mysql` (Uses Render's internal service networking)
  - `DB_PORT=3306`
  - `DB_USER=app_user`
  - `DB_PASSWORD=secure_password_change_me` (Update this!)
  - `DB_NAME=project_cid`

- **Server Configuration:**
  - `NODE_ENV=production`
  - `PORT=3000` (Changed from 5000)

- **CORS Configuration:**
  - `FRONTEND_ORIGIN=https://project-cid-nine.vercel.app,https://project-cid.onrender.com,http://localhost:5173,http://localhost,http://127.0.0.1`

- **Email Configuration:**
  - Update `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `SMTP_FROM` before deployment

#### `backend/server.js` (Updated)
- Updated CORS allowed origins to include:
  - `https://project-cid-nine.vercel.app` (Vercel deployment)
  - `https://project-cid.onrender.com` (Render deployment)

#### `frontend/.env` (Created)
- Development environment variables
- Points to local backend at `http://localhost:3000` for dev

#### `frontend/.env.production` (Created)
- Production environment variables
- Points to Render backend: `https://project-cid.onrender.com/api`

### 2. Database Configuration (`backend/config/db.js`)

The existing `db.js` already supports:
- Individual environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- Connection pooling with configurable size
- SSL/TLS support for remote databases

**No changes needed** — it will automatically use the environment variables.

### 3. Deployment Steps

#### Option A: Using `render.yaml` (Recommended)
1. Push all changes to your GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will automatically detect and deploy using `render.yaml`

#### Option B: Manual Setup in Render Dashboard

**Step 1: Create MySQL Service**
1. New → Private Service
2. Name: `mysql`
3. Environment: Docker
4. Image: `mysql:8.0`
5. Set environment variables:
   - `MYSQL_DATABASE`: `project_cid`
   - `MYSQL_USER`: `app_user`
   - `MYSQL_PASSWORD`: `[secure password]`
   - `MYSQL_ROOT_PASSWORD`: `[secure password]`
6. Disk: Create disk named `mysql-data`, mount at `/var/lib/mysql`, 10 GB

**Step 2: Create Backend Service**
1. New → Web Service
2. Connect GitHub repository (main branch)
3. Runtime: Node
4. Build command: `cd backend && npm install`
5. Start command: `cd backend && npm start`
6. Environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=mysql
   DB_PORT=3306
   DB_USER=app_user
   DB_PASSWORD=[same as MySQL]
   DB_NAME=project_cid
   DB_POOL_SIZE=20
   DB_SSL=false
   FRONTEND_ORIGIN=https://project-cid-nine.vercel.app,https://project-cid.onrender.com
   JWT_SECRET=[generate secure random string]
   GMAIL_USER=[your email]
   GMAIL_APP_PASSWORD=[app password]
   SMTP_FROM=[your email]
   ```

**Step 3: Create Frontend Service**
1. New → Static Site
2. Connect GitHub repository (main branch)
3. Build command: `cd frontend && npm install && npm run build`
4. Publish directory: `frontend/dist`
5. Environment variables:
   ```
   VITE_API_URL=https://project-cid.onrender.com/api
   VITE_APP_NAME=Project CID
   VITE_ENV=production
   ```

### 4. Required Before Deployment

- [ ] Update `DB_PASSWORD` in `render.yaml` with a secure password
- [ ] Update `MYSQL_ROOT_PASSWORD` in `render.yaml` with a secure password
- [ ] Generate a secure `JWT_SECRET` (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Update `GMAIL_USER` and `GMAIL_APP_PASSWORD` if email features are used
- [ ] Verify `FRONTEND_ORIGIN` matches your actual domains
- [ ] Test database migrations run on startup

### 5. Database Migrations

The backend runs migrations automatically on startup via `runMigrations()` in `server.js`. Ensure:
- Migration files exist in `backend/database/migrations/`
- Database has proper write permissions
- Initial schema is in `backend/database/shs.sql` (if using as seed)

### 6. Service Networking

In Render, services communicate using service names as hostnames:
- Backend connects to MySQL at: `mysql:3306`
- Frontend requests go through Render's routing to backend public URL

### 7. Environment Variables Best Practices

**Sensitive Values to Update:**
- `DB_PASSWORD` - Generate a strong password
- `MYSQL_ROOT_PASSWORD` - Generate a strong password
- `JWT_SECRET` - Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `GMAIL_APP_PASSWORD` - Use app-specific password, not your main Gmail password
- `FRONTEND_ORIGIN` - Update if domain changes

### 8. Troubleshooting

**Backend can't connect to MySQL:**
- Ensure MySQL service is running (check Render dashboard)
- Verify `DB_HOST=mysql` and `DB_PORT=3306`
- Check `DB_PASSWORD` matches `MYSQL_PASSWORD`

**CORS errors:**
- Verify `FRONTEND_ORIGIN` includes correct frontend URL
- Check `server.js` line 29-38 for allowed origins

**Database migrations fail:**
- Check `backend/database/migrations/` exist
- Verify user permissions (should have CREATE/ALTER)
- Check `backend/database/runMigrations.js` error handling

**Static frontend not updating:**
- Clear browser cache (Ctrl+Shift+Del)
- Force rebuild in Render dashboard
- Verify build command runs without errors

### 9. Production Checklist

- [ ] All environment variables set in Render
- [ ] Database migrations completed successfully
- [ ] CORS configured for your frontend domain
- [ ] JWT_SECRET is strong and random
- [ ] Email configuration working (test before full deployment)
- [ ] Uploads directory permissions verified
- [ ] Rate limiting configured (already in middleware)
- [ ] SSL/HTTPS enforced
- [ ] Database backups enabled in Render

### 10. Monitoring

- Check Render dashboard logs for errors
- Monitor resource usage (CPU, memory, disk)
- Set up alerts for service failures
- Review audit logs regularly

---

**Status:** Ready for deployment  
**Last Updated:** May 2026
