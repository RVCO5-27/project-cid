/**
 * Audit Logging Service
 * Reusable utility for logging user actions throughout the system
 * Features:
 * - Uses prepared statements to prevent SQL injection
 * - Errors are logged but don't break the main flow
 * - Logs are immutable (cannot be edited or deleted)
 * - Comprehensive logging for all action types
 */

const db = require('../config/db');

let auditAvailable = true;

// Probe if audit table exists on startup
async function probeAuditTable() {
  try {
    await db.execute('SELECT 1 FROM audit_logs LIMIT 1');
    auditAvailable = true;
    console.log('[auditService] Audit logs table is available');
  } catch (e) {
    auditAvailable = false;
    console.warn('[auditService] audit_logs table not available - audit logging disabled');
  }
}
probeAuditTable();

/**
 * Main logging function - logs an audit action with prepared statements
 * @param {object} options - Logging options
 * @param {number} options.userId - ID of the user performing the action (nullable for failed logins)
 * @param {string} options.action - Action type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, UPLOAD, DOWNLOAD, VIEW
 * @param {string} options.status - Status: SUCCESS or FAILED (default: SUCCESS)
 * @param {string} options.module - Module affected: auth, documents, issuances, users, schools, etc.
 * @param {string} options.description - Human-readable description of the action
 * @param {string|number} options.recordId - ID of the record being modified
 * @param {string} options.resourceType - Type of resource (e.g., 'issuance', 'document', 'user')
 * @param {number} options.resourceId - ID of the resource
 * @param {object} options.oldValue - Previous values (for UPDATE, DELETE)
 * @param {object} options.newValue - New values (for CREATE, UPDATE)
 * @param {object} options.diffSnapshot - Detailed diff of changes
 * @param {string} options.ipAddress - IP address of the request
 * @param {string} options.userAgent - User agent string from request
 * @returns {Promise<number|null>} - Returns the inserted log ID on success, null on error
 */
async function logAuditEvent(options = {}) {
  if (!auditAvailable) return null;

  try {
    const {
      userId,
      action,
      status = 'SUCCESS',
      module,
      description,
      recordId,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      diffSnapshot,
      ipAddress,
      userAgent
    } = options;

    // Validate required fields
    if (!action || !module) {
      console.warn('[auditService] Missing required fields (action, module)', { action, module });
      return null;
    }

    // Validate status
    if (!['SUCCESS', 'FAILED'].includes(status)) {
      console.warn('[auditService] Invalid status value:', status);
      return null;
    }

    // Prepare JSON fields - convert objects to JSON strings
    const oldValueJson = oldValue ? JSON.stringify(oldValue) : null;
    const newValueJson = newValue ? JSON.stringify(newValue) : null;
    const diffSnapshotJson = diffSnapshot ? JSON.stringify(diffSnapshot) : null;

    // Insert log using prepared statement (prevents SQL injection)
    const sql = `
      INSERT INTO audit_logs (
        user_id, 
        action_type, 
        status,
        module, 
        description,
        record_id,
        resource_type,
        resource_id,
        old_value,
        new_value,
        diff_snapshot,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      userId || null,
      action,
      status,
      module,
      description || null,
      recordId || null,
      resourceType || null,
      resourceId || null,
      oldValueJson,
      newValueJson,
      diffSnapshotJson,
      ipAddress || null,
      userAgent || null
    ]);

    console.log(`[auditService] Logged ${action}:${status} in ${module} (ID: ${result.insertId})`);
    return result.insertId;
  } catch (err) {
    // Log error but don't throw - audit logging shouldn't break the main flow
    console.error('[auditService] Error logging audit action:', {
      error: err.message,
      errorCode: err.code,
      options: { action: options.action, module: options.module, status: options.status }
    });
    return null;
  }
}

/**
 * Log a login attempt (success or failure)
 * @param {number} userId - User ID (nullable for failed logins)
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @param {boolean} success - Whether login was successful
 */
async function logLogin(userId, ipAddress, userAgent, success = true) {
  return logAuditEvent({
    userId,
    action: 'LOGIN',
    status: success ? 'SUCCESS' : 'FAILED',
    module: 'auth',
    description: success
      ? 'Signed in successfully'
      : 'Sign-in failed (check username and password)',
    ipAddress,
    userAgent
  });
}

/**
 * Log a logout
 * @param {number} userId - User ID
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logLogout(userId, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'LOGOUT',
    module: 'auth',
    description: 'Signed out',
    ipAddress,
    userAgent
  });
}

/**
 * Log blocked API access (no session, bad token, or not allowed).
 * Uses action PERMISSION_DENIED so the Activity Log stays easy to scan.
 */
async function logPermissionDenied(options = {}) {
  const {
    userId = null,
    description,
    ipAddress,
    userAgent,
    path,
    method,
  } = options;
  return logAuditEvent({
    userId,
    action: 'PERMISSION_DENIED',
    status: 'FAILED',
    module: 'security',
    description: description || 'Access was blocked',
    newValue: path ? { path, method: method || 'GET' } : undefined,
    ipAddress,
    userAgent
  });
}

/**
 * Log a document upload
 * @param {number} userId - User ID
 * @param {string} fileName - Name of uploaded file
 * @param {number} fileId - ID of the file record
 * @param {number} fileSize - Size of file in bytes
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logUpload(userId, fileName, fileId, fileSize, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'UPLOAD',
    module: 'documents',
    description: `Uploaded file: ${fileName} (${formatBytes(fileSize)})`,
    resourceType: 'file',
    resourceId: fileId,
    newValue: { fileName, fileSize },
    ipAddress,
    userAgent
  });
}

/**
 * Log a download
 * @param {number} userId - User ID
 * @param {string} fileName - Name of downloaded file
 * @param {number} fileId - ID of the file record
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logDownload(userId, fileName, fileId, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'DOWNLOAD',
    module: 'documents',
    description: `Downloaded file: ${fileName}`,
    resourceType: 'file',
    resourceId: fileId,
    ipAddress,
    userAgent
  });
}

/**
 * Log a create action
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {object} newValue - New record data
 * @param {number} resourceId - ID of created resource
 * @param {string} resourceType - Type of resource
 * @param {string} description - Description of action
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logCreate(userId, module, newValue, resourceId, resourceType, description, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'CREATE',
    module,
    description: description || `Created new ${resourceType}`,
    resourceType,
    resourceId,
    newValue,
    ipAddress,
    userAgent
  });
}

/**
 * Log an update action
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {object} oldValue - Previous record data
 * @param {object} newValue - New record data
 * @param {number} resourceId - ID of updated resource
 * @param {string} resourceType - Type of resource
 * @param {object} diffSnapshot - Detailed diff object
 * @param {string} description - Description of action
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logUpdate(userId, module, oldValue, newValue, resourceId, resourceType, diffSnapshot, description, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'UPDATE',
    module,
    description: description || `Updated ${resourceType}`,
    resourceType,
    resourceId,
    oldValue,
    newValue,
    diffSnapshot,
    ipAddress,
    userAgent
  });
}

/**
 * Log a delete action
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {object} oldValue - Deleted record data
 * @param {number} resourceId - ID of deleted resource
 * @param {string} resourceType - Type of resource
 * @param {string} description - Description of action
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logDelete(userId, module, oldValue, resourceId, resourceType, description, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'DELETE',
    module,
    description: description || `Deleted ${resourceType}`,
    resourceType,
    resourceId,
    oldValue,
    ipAddress,
    userAgent
  });
}

/**
 * Log a session timeout
 * @param {number} userId - User ID
 * @param {number} sessionDurationMs - Duration of session in milliseconds
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logSessionTimeout(userId, sessionDurationMs, ipAddress, userAgent) {
  return logAuditEvent({
    userId,
    action: 'SESSION_TIMEOUT',
    module: 'auth',
    description: `Session expired after ${Math.round(sessionDurationMs / 1000)} seconds`,
    newValue: { sessionDurationMs },
    ipAddress,
    userAgent
  });
}

/**
 * Log a role change (e.g., Admin -> SuperAdmin)
 * @param {number} adminId - Admin ID making the change
 * @param {number} targetUserId - User ID whose role is being changed
 * @param {string} fromRole - Previous role
 * @param {string} toRole - New role
 * @param {string} reason - Reason for role change
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logRoleChange(adminId, targetUserId, fromRole, toRole, reason, ipAddress, userAgent) {
  return logAuditEvent({
    userId: adminId,
    action: 'ROLE_CHANGE',
    module: 'admin_management',
    description: `Role changed from ${fromRole} to ${toRole}. Reason: ${reason || 'Not specified'}`,
    resourceType: 'user_role',
    resourceId: targetUserId,
    oldValue: { role: fromRole },
    newValue: { role: toRole, reason },
    ipAddress,
    userAgent
  });
}

/**
 * Log an account status change (e.g., active -> suspended)
 * @param {number} adminId - Admin ID making the change
 * @param {number} targetUserId - User ID whose status is being changed
 * @param {string} fromStatus - Previous status
 * @param {string} toStatus - New status
 * @param {string} reason - Reason for status change
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logAccountStatusChange(adminId, targetUserId, fromStatus, toStatus, reason, ipAddress, userAgent) {
  return logAuditEvent({
    userId: adminId,
    action: 'ACCOUNT_STATUS_CHANGE',
    module: 'admin_management',
    description: `Account status changed from ${fromStatus} to ${toStatus}. Reason: ${reason || 'Not specified'}`,
    resourceType: 'user_status',
    resourceId: targetUserId,
    oldValue: { status: fromStatus },
    newValue: { status: toStatus, reason },
    ipAddress,
    userAgent
  });
}

/**
 * Log a system configuration change
 * @param {number} adminId - Admin ID making the change
 * @param {string} settingName - Name of setting that changed
 * @param {*} oldValue - Previous value
 * @param {*} newValue - New value
 * @param {string} description - Description of change
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logConfigChange(adminId, settingName, oldValue, newValue, description, ipAddress, userAgent) {
  return logAuditEvent({
    userId: adminId,
    action: 'SECURITY_SETTING_CHANGE',
    status: 'SUCCESS',
    module: 'system_config',
    description: description || `Configuration changed: ${settingName}`,
    resourceType: 'system_setting',
    resourceId: null,
    oldValue: { [settingName]: oldValue },
    newValue: { [settingName]: newValue },
    ipAddress,
    userAgent
  });
}

/**
 * Log backup creation
 * @param {number} adminId - Admin ID (if triggered manually)
 * @param {string} backupFileName - Name of backup file
 * @param {number} databaseSizeBytes - Size of database backed up
 * @param {number} backupSizeBytes - Size of backup file
 * @param {number} durationMs - Duration of backup in milliseconds
 * @param {string} status - SUCCESS or FAILED
 * @param {boolean} automated - Whether backup was automated
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logBackupCreated(adminId, backupFileName, databaseSizeBytes, backupSizeBytes, durationMs, status = 'SUCCESS', automated = false, ipAddress, userAgent) {
  return logAuditEvent({
    userId: adminId,
    action: 'BACKUP_CREATED',
    status: status,
    module: 'database',
    description: `Backup created: ${backupFileName} (${formatBytes(databaseSizeBytes)} -> ${formatBytes(backupSizeBytes)}) in ${Math.round(durationMs / 1000)}s${automated ? ' [Automated]' : ''}`,
    resourceType: 'backup',
    newValue: {
      backupFileName,
      databaseSizeBytes,
      backupSizeBytes,
      durationMs,
      automated
    },
    ipAddress,
    userAgent
  });
}

/**
 * Log backup restoration
 * @param {number} adminId - Admin ID restoring backup
 * @param {string} backupFileName - Name of backup being restored
 * @param {string} restoredAt - Timestamp of when backup was taken
 * @param {string} reason - Reason for restoration
 * @param {number} durationMs - Duration of restore in milliseconds
 * @param {string} status - SUCCESS or FAILED
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logBackupRestored(adminId, backupFileName, restoredAt, reason, durationMs, status = 'SUCCESS', ipAddress, userAgent) {
  return logAuditEvent({
    userId: adminId,
    action: 'BACKUP_RESTORED',
    status: status,
    module: 'database',
    description: `Backup restored from ${backupFileName}. Reason: ${reason || 'Not specified'} (${Math.round(durationMs / 1000)}s)`,
    resourceType: 'backup_restore',
    newValue: {
      backupFileName,
      restoredAt,
      reason,
      durationMs
    },
    ipAddress,
    userAgent
  });
}

/**
 * Log a critical error
 * @param {number} userId - User ID (nullable)
 * @param {string} errorCode - HTTP status or error code
 * @param {string} errorMessage - Error message
 * @param {string} endpoint - API endpoint that failed
 * @param {string} stackTrace - Stack trace (first 500 chars)
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
async function logCriticalError(userId, errorCode, errorMessage, endpoint, stackTrace, ipAddress, userAgent) {
  return logAuditEvent({
    userId: userId || null,
    action: 'CRITICAL_ERROR',
    status: 'FAILED',
    module: 'system',
    description: `Critical error: ${errorCode} - ${errorMessage} at ${endpoint}`,
    resourceType: 'error',
    newValue: {
      errorCode,
      errorMessage,
      endpoint,
      stackTrace: stackTrace ? stackTrace.substring(0, 500) : 'N/A'
    },
    ipAddress,
    userAgent
  });
}

/**
 * Extract IP address from request
 * @param {object} req - Express request object
 * @returns {string} - IP address
 */
function getClientIp(req) {
  if (!req) return 'unknown';
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request
 * @param {object} req - Express request object
 * @returns {string} - User agent string
 */
function getUserAgent(req) {
  return req?.headers['user-agent'] || '';
}

/**
 * Calculate diff between two objects
 * @param {object} oldObj - Old object
 * @param {object} newObj - New object
 * @returns {object} - Diff object
 */
function calculateDiff(oldObj = {}, newObj = {}) {
  const diff = {
    added: {},
    modified: {},
    removed: {}
  };

  // Find added and modified fields
  Object.keys(newObj).forEach(key => {
    if (!(key in oldObj)) {
      diff.added[key] = newObj[key];
    } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff.modified[key] = {
        from: oldObj[key],
        to: newObj[key]
      };
    }
  });

  // Find removed fields
  Object.keys(oldObj).forEach(key => {
    if (!(key in newObj)) {
      diff.removed[key] = oldObj[key];
    }
  });

  return diff;
}

/**
 * Format bytes for display
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Initialize audit log immutability (prevent updates/deletes)
 * Call this during server startup
 */
async function ensureImmutable() {
  if (!auditAvailable) return;

  try {
    // Drop existing triggers if they exist
    try {
      // MySQL does not allow CREATE/DROP TRIGGER via prepared statements.
      // `db.execute()` uses the prepared statement protocol; use `db.query()` for DDL.
      await db.query('DROP TRIGGER IF EXISTS prevent_audit_update');
      await db.query('DROP TRIGGER IF EXISTS prevent_audit_delete');
    } catch (e) {
      // Ignore errors dropping triggers
    }

    // Create trigger to prevent updates
    await db.query(`
      CREATE TRIGGER prevent_audit_update 
      BEFORE UPDATE ON audit_logs 
      FOR EACH ROW 
      BEGIN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Audit logs are immutable and cannot be modified'; 
      END
    `);

    // Create trigger to prevent deletes
    await db.query(`
      CREATE TRIGGER prevent_audit_delete 
      BEFORE DELETE ON audit_logs 
      FOR EACH ROW 
      BEGIN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Audit logs are immutable and cannot be deleted'; 
      END
    `);

    console.log('[auditService] Audit log immutability triggers created successfully');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('[auditService] Immutability triggers already exist');
    } else {
      console.warn('[auditService] Failed to create immutability triggers:', err.message);
    }
  }
}

module.exports = {
  logAuditEvent,
  logLogin,
  logLogout,
  logPermissionDenied,
  logUpload,
  logDownload,
  logCreate,
  logUpdate,
  logDelete,
  logSessionTimeout,
  logRoleChange,
  logAccountStatusChange,
  logConfigChange,
  logBackupCreated,
  logBackupRestored,
  logCriticalError,
  getClientIp,
  getUserAgent,
  calculateDiff,
  formatBytes,
  ensureImmutable,
  isAuditAvailable: () => auditAvailable
};
