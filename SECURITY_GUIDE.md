# Security Guide - Environment Variables & Secrets Management

## 🔒 Overview

This document outlines best practices for managing sensitive data in this project. **NEVER commit secrets to version control**. All credentials must be stored in `.env` files or environment variables.

---

## 🚨 Critical Files & Variables

### Backend Secrets (`backend/.env`)

| Variable | Purpose | Security Level | Example |
|----------|---------|-----------------|---------|
| `JWT_SECRET` | JWT token signing key | **CRITICAL** | 64-char random hex string |
| `DATABASE_URL` | Full database connection string | **CRITICAL** | `mysql://user:pass@host:3306/db` |
| `DB_PASS`/`DB_PASSWORD` | Database password | **CRITICAL** | Strong, unique password |
| `DB_HOST` | Database host | Medium | `localhost` or cloud URL |
| `DB_USER` | Database user | Medium | `root` |
| `GMAIL_USER` | Gmail account for recovery emails | High | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Google App Password (NOT main password) | **CRITICAL** | 16-character app password |
| `SMTP_USER`/`SMTP_PASS` | SMTP server credentials | **CRITICAL** | Email service credentials |
| `FRONTEND_ORIGIN` | Allowed CORS origins | Low | Comma-separated URLs |
| `PORT` | Server port | Low | `5000` |
| `NODE_ENV` | Environment name | Low | `development`, `production` |

### Frontend Secrets (`frontend/.env*`)

✅ **Good news**: Frontend only stores non-sensitive configuration:
- `VITE_API_URL` - Backend API endpoint (not secret)
- `VITE_PROXY_TARGET` - Dev proxy target (not secret)
- `VITE_ADMIN_REQUIRE_HTTPS` - Configuration flag (not secret)

---

## ⚠️ What Should NEVER Be Committed

1. ✗ `.env` files (database passwords, API keys, JWT secrets)
2. ✗ `.env.production` files
3. ✗ Hardcoded passwords in source code
4. ✗ API tokens or keys
5. ✗ Private keys or certificates
6. ✗ Database dumps with real data

---

## ✅ What SHOULD Be Committed

1. ✓ `.env.example` - Template with placeholder values
2. ✓ `.gitignore` - Properly configured to exclude secrets
3. ✓ `SECURITY_GUIDE.md` - This documentation
4. ✓ Source code (no passwords)
5. ✓ Configuration templates

---

## 🔑 Generating Secure Values

### JWT Secret
```bash
# Generate a 64-character random hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Password
```bash
# Generate a strong random password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Gmail App Password
1. Enable 2FA on your Google account
2. Go to myaccount.google.com/apppasswords
3. Select "Mail" and "Windows (or custom)"
4. Generate a 16-character app password
5. Never use your main Gmail password

---

## 📋 Setup Instructions

### First-Time Setup

1. **Copy template files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Fill in `.env` files with your values:**
   ```bash
   # backend/.env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_password
   JWT_SECRET=your-generated-64-char-string
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

3. **Verify `.gitignore` includes:**
   ```
   .env
   .env.local
   .env.*.local
   .env.production
   ```

4. **Test that secrets are not exposed:**
   ```bash
   git status  # Should NOT show .env files
   ```

---

## 🧪 Using Environment Variables in Tests

### Hardcoded Test Credentials
Instead of hardcoding passwords in test files, use environment variables:

```javascript
// ❌ BAD - Don't do this
const password = 'TestPassword123!';

// ✅ GOOD - Do this
const password = process.env.TEST_PASSWORD || 'TestPassword123!';
```

### Test Environment Setup
```bash
# Set credentials for running tests
export TEST_ADMIN_USER="test_user"
export TEST_ADMIN_PASSWORD="test_password"
export TEST_PASSWORD="test_pass_for_validation"
export RECOVERY_TOKEN="test_token_value"

# Run tests
npm test
```

---

## 🚀 Deployment to Production

### Render.com / Vercel Setup

1. **Define Environment Variables in Dashboard:**
   - Go to Settings → Environment Variables
   - Add all values from `.env`:
     - `JWT_SECRET`
     - `DATABASE_URL` (full connection string)
     - `GMAIL_USER`
     - `GMAIL_APP_PASSWORD`
     - `NODE_ENV=production`
     - etc.

2. **Use render.yaml for Deployment:**
   ```yaml
   envVars:
     - key: JWT_SECRET
       value: ${JWT_SECRET}
     - key: DATABASE_URL
       value: ${DATABASE_URL}
   ```

3. **Never put secrets in:**
   - `render.yaml` (use secret references)
   - `package.json` scripts
   - GitHub Actions (use repository secrets)
   - Docker images

---

## 🔍 Audit & Verification

### Scan for Hardcoded Secrets
```bash
# Look for common patterns
grep -r "password\|secret\|api_key\|apikey" backend/src --include="*.js" | grep -v node_modules | grep -v ".env"

# More thorough scan
git grep -i "secret\|password\|api.key" -- '*.js' '*.jsx' ':!package-lock.json' ':!node_modules'
```

### Check Git History
```bash
# Look for secrets in commit history
git log -p | grep -i "password\|secret"

# Use git-secrets tool (install: brew install git-secrets)
git secrets --scan
```

### Verify Files Before Committing
```bash
# Make sure .env is in .gitignore
cat .gitignore | grep "\.env"

# Check what will be committed
git diff --cached --name-only
```

---

## 🛡️ Security Best Practices

### Backend
1. ✅ Use `process.env` for ALL secrets
2. ✅ Validate and sanitize all inputs
3. ✅ Don't log sensitive data
4. ✅ Use HTTPS in production
5. ✅ Implement rate limiting
6. ✅ Use strong password hashing (bcrypt)
7. ✅ Expire tokens appropriately
8. ✅ Use secure cookies (httpOnly, Secure flags)

### Frontend
1. ✅ Never store auth tokens in localStorage (use httpOnly cookies)
2. ✅ Only store public configuration in `.env`
3. ✅ Never expose API keys or secrets
4. ✅ Validate user input
5. ✅ Use HTTPS only in production
6. ✅ Implement CSRF protection

### Database
1. ✅ Use strong, unique passwords
2. ✅ Limit database user permissions
3. ✅ Use SSL/TLS for connections
4. ✅ Regular backups with encryption
5. ✅ Never expose connection strings in code
6. ✅ Audit database access logs

---

## 📚 Tools & Resources

### Environment Variable Tools
- **dotenv** - Load `.env` files (built into our setup)
- **direnv** - Per-directory environment variables
- **1Password, LastPass** - Secure credential storage

### Secret Scanning
- **git-secrets** - Prevent secrets from being committed
- **TruffleHog** - Search for secrets in Git history
- **OWASP SecretScanner** - Find exposed secrets

### Security Audits
- **npm audit** - Check for vulnerable dependencies
- **OWASP Top 10** - Web application security guidelines
- **CWE** - Common Weakness Enumeration reference

---

## 🔔 Common Mistakes to Avoid

| ❌ DO NOT | ✅ DO INSTEAD |
|----------|---------------|
| Hardcode passwords in source | Use environment variables |
| Commit `.env` files | Add `.env` to `.gitignore` |
| Use main Gmail password | Use app-specific password |
| Log sensitive data | Mask/redact in logs |
| Share secrets in Slack/email | Use password manager |
| Simple passwords | Use strong, random passwords |
| Same secrets everywhere | Unique per environment |
| Commit to `main` branch directly | Use branches + PR reviews |

---

## 🚨 If a Secret is Exposed

### Immediate Actions
1. Revoke the exposed credential immediately
2. Generate a new secret
3. Update all systems using the old secret
4. Check Git history for when it was exposed
5. Notify relevant stakeholders

### Cleanup
```bash
# Remove sensitive data from Git history (use git-filter-branch carefully)
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch backend/.env' --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

## 📞 Questions?

If you have questions about security setup or best practices:
1. Review this guide again
2. Check the `.env.example` files for examples
3. Test changes locally before deploying
4. Ask in the team chat with security concerns

---

**Last Updated:** May 2026  
**Security Review Status:** ✅ Current
