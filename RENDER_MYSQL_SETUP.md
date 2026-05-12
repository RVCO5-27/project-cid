# Render MySQL Setup Guide

## 🚀 Step 1: Create MySQL Private Service Manually

Since Render Blueprints don't fully automate MySQL `private` service creation, follow these steps:

### In Render Dashboard:

1. **Create New Private Service for MySQL**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Private Service"**
   - **Name:** `mysql`
   - **Environment:** `Docker`
   - **Image URL:** `docker.io/library/mysql:8.0`
   - **Disk:** 
     - Name: `mysql-data`
     - Mount path: `/var/lib/mysql`
     - Size: 10 GB
   - **Environment Variables:**
     ```
     MYSQL_DATABASE=project_cid
     MYSQL_USER=app_user
     MYSQL_PASSWORD=secure_password_change_me
     MYSQL_ROOT_PASSWORD=root_secure_password_change_me
     ```
   - Click **"Create Private Service"**

2. **Wait for MySQL to start** (5-10 minutes)
   - Check status in Dashboard until it shows "Running"

---

## 🚀 Step 2: Deploy Backend & Frontend via Blueprint

Once MySQL is running:

1. Go back to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo: `RVCO5-27/project-cid`
4. Render will auto-detect the `render.yaml` (simplified version without MySQL)
5. Click **"Deploy"**

Render will create:
- **Backend** web service
- **Frontend** static site

---

## 🚀 Step 3: Connect Backend to MySQL

The backend will automatically connect to MySQL using:
- **Host:** `mysql` (Render's internal DNS)
- **Port:** `3306`
- **User:** `app_user`
- **Password:** (from environment variables)
- **Database:** `project_cid`

---

## ✅ Verification Checklist

- [ ] MySQL private service is "Running"
- [ ] Backend deployment successful
- [ ] Frontend deployment successful
- [ ] Check backend logs for successful DB connection
- [ ] Test API endpoints from frontend

---

## 🔧 Common Issues

**Backend can't connect to MySQL:**
- Ensure MySQL service is fully running (not just "pending")
- Check backend environment variables include `DB_HOST=mysql`, `DB_PORT=3306`
- Verify `DB_PASSWORD` matches `MYSQL_PASSWORD` from MySQL service

**Database migrations fail:**
- SSH into MySQL service and check `project_cid` database exists
- Verify `app_user` has proper permissions

---

## 📝 Summary

| Service | Type | Status |
|---------|------|--------|
| MySQL | Private | ✓ Manual setup |
| Backend | Web | ✓ Blueprint |
| Frontend | Static | ✓ Blueprint |

Your project is now ready for production deployment! 🎉
