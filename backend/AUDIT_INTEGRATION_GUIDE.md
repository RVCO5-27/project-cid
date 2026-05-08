# Audit Logging Integration Guide

This guide shows how to use the audit logging system in your endpoint controllers.

## Overview

The audit logging service provides reusable functions to log all user actions. Logs are:
- **Immutable** - Cannot be modified or deleted due to database triggers
- **Safe** - Uses prepared statements to prevent SQL injection
- **Non-blocking** - Errors in logging don't break the main flow
- **Comprehensive** - Captures user, module, action, changes, and metadata

## Quick Usage

### 1. Import the Audit Service

```javascript
const { 
  logAuditEvent,
  logLogin, 
  logLogout,
  logUpload,
  logDownload,
  logCreate,
  logUpdate,
  logDelete,
  getClientIp,
  getUserAgent,
  calculateDiff
} = require('../services/auditService');
```

### 2. Get Client Information

Always extract IP address and user agent from requests:

```javascript
const auditService = require('../services/auditService');

// In your controller
const ipAddress = auditService.getClientIp(req);
const userAgent = auditService.getUserAgent(req);
```

---

## Logging for Different Actions

### LOGIN / LOGOUT

```javascript
// Successful login
await logLogin(userId, ipAddress, userAgent, true);

// Failed login attempt
await logLogin(userId, ipAddress, userAgent, false);

// Logout
await logLogout(userId, ipAddress, userAgent);
```

### UPLOAD / DOWNLOAD

```javascript
// File upload
await logUpload(
  userId,
  'document.pdf',  // fileName
  fileId,          // ID from database
  fileSize,        // bytes
  ipAddress,
  userAgent
);

// File download
await logDownload(
  userId,
  'document.pdf',
  fileId,
  ipAddress,
  userAgent
);
```

### CREATE - New Resource

```javascript
const { logCreate, calculateDiff } = require('../services/auditService');

// After creating a new issuance
await logCreate(
  userId,
  'issuances',                    // module
  { title: 'New Policy', ... },   // The new data created
  issuanceId,                     // resourceId
  'issuance',                     // resourceType
  'Created new issuance: New Policy',  // Optional description
  ipAddress,
  userAgent
);
```

### UPDATE - Modify Resource

```javascript
const { logUpdate, calculateDiff } = require('../services/auditService');

// Store old values before update
const [[oldRecord]] = await db.execute(
  'SELECT * FROM issuances WHERE id = ?',
  [issuanceId]
);

// ... perform update ...

// Calculate what changed
const diff = calculateDiff(oldRecord, updateData);

// Log the update
await logUpdate(
  userId,
  'issuances',           // module
  oldRecord,             // previous values
  updateData,            // new values
  issuanceId,            // resourceId
  'issuance',            // resourceType
  diff,                  // detailed changes
  'Updated issuance title and status',  // Optional description
  ipAddress,
  userAgent
);
```

### DELETE - Remove Resource

```javascript
const { logDelete } = require('../services/auditService');

// Fetch the record before deletion
const [[recordToDelete]] = await db.execute(
  'SELECT * FROM issuances WHERE id = ?',
  [issuanceId]
);

// ... perform deletion ...

// Log the deletion
await logDelete(
  userId,
  'issuances',              // module
  recordToDelete,           // the deleted data
  issuanceId,               // resourceId
  'issuance',               // resourceType
  'Deleted issuance: New Policy',  // Optional description
  ipAddress,
  userAgent
);
```

### Generic Logging

For complex scenarios, use the main function:

```javascript
const { logAuditEvent } = require('../services/auditService');

await logAuditEvent({
  userId: req.user.id,
  action: 'CREATE',           // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, UPLOAD, DOWNLOAD
  module: 'schools',          // What module this affects
  description: 'Registered new school: Xavier High School',
  recordId: schoolId,         // ID of affected record
  resourceType: 'school',     // Type of resource
  resourceId: schoolId,       // ID of resource
  newValue: { ... },          // New data (for CREATE, UPDATE)
  oldValue: { ... },          // Old data (for UPDATE, DELETE)
  diffSnapshot: diff,         // Detailed diff (optional)
  ipAddress,
  userAgent
});
```

---

## Integration Examples

### Example 1: Issuance Upload with Audit Logging

```javascript
// In issuances.js controller
const { logUpload, getClientIp, getUserAgent } = require('../services/auditService');

exports.uploadIssuance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // ... handle upload
    const file = req.file;
    const issuanceId = req.body.issuanceId;

    // Create database record
    const [result] = await db.execute(
      'INSERT INTO files (filename, originalname, path, size, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [file.filename, file.originalname, file.path, file.size, userId]
    );

    // Log the upload
    await logUpload(
      userId,
      file.originalname,
      result.insertId,
      file.size,
      ipAddress,
      userAgent
    );

    res.json({ message: 'File uploaded', fileId: result.insertId });
  } catch (err) {
    next(err);
  }
};
```

### Example 2: User Creation with Audit Logging

```javascript
const { logCreate, getClientIp, getUserAgent } = require('../services/auditService');

exports.createAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, role } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Create admin
    const [result] = await db.execute(
      'INSERT INTO admins (username, email, role, password) VALUES (?, ?, ?, ?)',
      [username, email, role, hashedPassword]
    );

    const newAdminId = result.insertId;
    const newAdminData = { username, email, role };

    // Log creation
    await logCreate(
      userId,
      'users',
      newAdminData,
      newAdminId,
      'admin',
      `Created admin user: ${username}`,
      ipAddress,
      userAgent
    );

    res.json({ message: 'Admin created', adminId: newAdminId });
  } catch (err) {
    next(err);
  }
};
```

### Example 3: School Update with Audit Logging

```javascript
const { 
  logUpdate, 
  calculateDiff,
  getClientIp, 
  getUserAgent 
} = require('../services/auditService');

exports.updateSchool = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { schoolId } = req.params;
    const updates = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Get current record
    const [[oldSchool]] = await db.execute(
      'SELECT * FROM schools WHERE id = ?',
      [schoolId]
    );

    // Update record
    const updateFields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const updateValues = Object.values(updates);
    
    await db.execute(
      `UPDATE schools SET ${updateFields} WHERE id = ?`,
      [...updateValues, schoolId]
    );

    // Calculate diff
    const diff = calculateDiff(oldSchool, updates);

    // Log update
    await logUpdate(
      userId,
      'schools',
      oldSchool,
      updates,
      schoolId,
      'school',
      diff,
      `Updated school: ${oldSchool.school_name}`,
      ipAddress,
      userAgent
    );

    res.json({ message: 'School updated' });
  } catch (err) {
    next(err);
  }
};
```

### Example 4: Document Deletion with Audit Logging

```javascript
const { 
  logDelete,
  getClientIp, 
  getUserAgent 
} = require('../services/auditService');

exports.deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { docId } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Get document before deletion
    const [[doc]] = await db.execute(
      'SELECT * FROM files WHERE id = ?',
      [docId]
    );

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from database
    await db.execute('DELETE FROM files WHERE id = ?', [docId]);

    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads', doc.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete file:', err);
    });

    // Log deletion
    await logDelete(
      userId,
      'documents',
      doc,
      docId,
      'file',
      `Deleted document: ${doc.originalname}`,
      ipAddress,
      userAgent
    );

    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
```

---

## Important Considerations

### 1. Always Use Prepared Statements

The audit service uses prepared statements. Make sure your data is passed as parameters, not concatenated into SQL:

```javascript
// ✅ Good
await db.execute('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ Bad - SQL injection risk
await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
```

### 2. Log Errors Won't Break Main Flow

If audit logging fails, the main operation continues:

```javascript
// This won't throw even if logging fails
await logCreate(userId, module, data, resourceId, resourceType, desc, ip, ua);

// Main operation completes even if audit fails
res.json({ success: true });
```

### 3. Use Correct Action Types

Valid action types: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `UPLOAD`, `DOWNLOAD`

### 4. Modules Should Be Descriptive

Common modules:
- `auth` - Authentication
- `users` - User management
- `documents` - Document management
- `issuances` - Policy issuances
- `schools` - School management
- `carousel` - Carousel management

### 5. Log Before Async Operations Complete

Log immediately after database changes, before sending response:

```javascript
// Insert record
const [result] = await db.execute(...);

// Log immediately
await logCreate(...);

// Then respond
res.json({ success: true });
```

---

## Table Structure

Audit logs are stored in the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,                           -- Who performed the action
  action_type ENUM(...),                 -- CREATE, UPDATE, DELETE, etc.
  module VARCHAR(100),                   -- Module name
  description TEXT,                      -- Human-readable description
  record_id VARCHAR(50),                 -- ID of affected record
  resource_type VARCHAR(50),             -- Type of resource
  resource_id INT,                       -- ID of resource
  old_value LONGTEXT,                    -- Previous values (JSON)
  new_value LONGTEXT,                    -- New values (JSON)
  diff_snapshot LONGTEXT,                -- Detailed diff (JSON)
  ip_address VARCHAR(45),                -- Client IP
  user_agent TEXT,                       -- Browser info
  timestamp TIMESTAMP DEFAULT NOW(),     -- When it happened
  KEY idx_timestamp (timestamp),
  KEY idx_user_id (user_id),
  KEY idx_action_type (action_type),
  KEY idx_module (module)
);
```

**Logs are protected by database triggers:**
- `prevent_audit_update` - Prevents any UPDATE on audit_logs
- `prevent_audit_delete` - Prevents any DELETE on audit_logs

---

## Testing Audit Logs

Query logged actions:

```sql
-- See all logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20;

-- Find specific user actions
SELECT * FROM audit_logs 
WHERE user_id = 1 
AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY timestamp DESC;

-- See modification history for a resource
SELECT * FROM audit_logs 
WHERE resource_id = 42 
AND resource_type = 'issuance'
ORDER BY timestamp ASC;
```

---

## Frontend Integration

The audit logs dashboard is accessible to SuperAdmins:

```javascript
// In AuditLogManagement.jsx
const data = await getAllAuditLogs({ 
  search: 'searchTerm',
  actionType: 'UPDATE',
  limit: 50,
  page: 1
});
```

View audit logs at: `/admin/audit-logs`

---

## Troubleshooting

### Logs Not Appearing

1. Check if audit_logs table exists
2. Verify database connection is active
3. Look for errors in server console (logged with `[auditService]` prefix)
4. Ensure `isAuditAvailable()` returns true

### Performance Issues

- Indexes are automatically created on timestamp, user_id, action_type, module
- Old logs can be archived or deleted based on retention policies
- Audit logging itself should not significantly impact performance

---

## Best Practices

✅ **DO:**
- Log immediately after database changes
- Include meaningful descriptions
- Use consistent module names
- Calculate and log diffs for updates
- Extract IP and user agent from every request

❌ **DON'T:**
- Wait for other async operations before logging
- Throw errors if logging fails
- Skip logging critical operations
- Log sensitive data (passwords, API keys)
- Concatenate values into SQL queries

