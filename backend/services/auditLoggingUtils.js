/**
 * Audit Logging Utilities
 * Quick-use functions for common audit logging scenarios
 */

const { logAuditEvent, getClientIp } = require('./auditService');

/**
 * Log user authentication event
 */
async function logAuthEvent(action, userId, req, details) {
  return logAuditEvent({
    userId,
    actionType: 'LOGIN',
    category: 'auth',
    module: 'authentication',
    description: action,
    ipAddress: getClientIp(req),
    status: 'success',
    details
  });
}

/**
 * Log failed authentication
 */
async function logFailedAuth(reason, ipAddress, details) {
  return logAuditEvent({
    userId: null,
    actionType: 'LOGIN',
    category: 'auth',
    module: 'authentication',
    description: `Failed login attempt: ${reason}`,
    ipAddress,
    status: 'failure',
    details
  });
}

/**
 * Log user management action
 */
async function logUserAction(action, userId, targetUserId, changes, req) {
  return logAuditEvent({
    userId,
    actionType: action, // CREATE, UPDATE, DELETE
    category: 'user',
    module: 'user_management',
    recordId: targetUserId,
    description: `User ${action.toLowerCase()}: ID ${targetUserId}`,
    oldValue: changes?.old,
    newValue: changes?.new,
    ipAddress: getClientIp(req),
    status: 'success',
    diffSnapshot: changes?.diff
  });
}

/**
 * Log content/document action
 */
async function logContentAction(action, userId, documentId, changes, req) {
  return logAuditEvent({
    userId,
    actionType: action, // CREATE, UPDATE, DELETE, UPLOAD
    category: 'content',
    module: 'content_management',
    recordId: documentId,
    description: `Document ${action.toLowerCase()}: ID ${documentId}`,
    oldValue: changes?.old,
    newValue: changes?.new,
    ipAddress: getClientIp(req),
    status: 'success',
    diffSnapshot: changes?.diff
  });
}

/**
 * Log permission/access control change
 */
async function logAccessChange(userId, targetUserId, action, newRole, req) {
  return logAuditEvent({
    userId,
    actionType: 'UPDATE',
    category: 'access',
    module: 'access_control',
    recordId: targetUserId,
    description: `${action} for user ID ${targetUserId}: ${newRole}`,
    ipAddress: getClientIp(req),
    status: 'success'
  });
}

/**
 * Log system event
 */
async function logSystemEvent(eventType, description, details, req) {
  return logAuditEvent({
    userId: null,
    actionType: 'UPDATE',
    category: 'system',
    module: 'system',
    description: `${eventType}: ${description}`,
    ipAddress: getClientIp(req),
    status: 'success',
    details
  });
}

/**
 * Log security event
 */
async function logSecurityEvent(eventType, severity, description, userId, req, details) {
  return logAuditEvent({
    userId: userId || null,
    actionType: 'UPDATE',
    category: 'security',
    module: 'security',
    description: `[${severity.toUpperCase()}] ${eventType}: ${description}`,
    ipAddress: getClientIp(req),
    status: severity === 'critical' ? 'failure' : 'warning',
    details
  });
}

/**
 * Log error/exception
 */
async function logError(errorType, message, userId, req, stack) {
  return logAuditEvent({
    userId: userId || null,
    actionType: 'UPDATE',
    category: 'system',
    module: 'error_handling',
    description: `Error: ${errorType} - ${message}`,
    ipAddress: getClientIp(req),
    status: 'failure',
    details: { stack }
  });
}

module.exports = {
  logAuthEvent,
  logFailedAuth,
  logUserAction,
  logContentAction,
  logAccessChange,
  logSystemEvent,
  logSecurityEvent,
  logError
};
