/**
 * Plain-language labels for the Activity Log (non-technical readers).
 * Keys match `audit_logs.action_type` values from the database.
 */
export const ACTION_LABELS = {
  CREATE: 'Added new information',
  UPDATE: 'Changed saved information',
  DELETE: 'Removed information',
  LOGIN: 'Sign-in attempt',
  LOGOUT: 'Signed out',
  UPLOAD: 'Uploaded a file',
  DOWNLOAD: 'Downloaded a file or report',
  VIEW: 'Viewed information',
  PASSWORD_RESET: 'Password reset',
  ACCOUNT_LOCKOUT: 'Account temporarily locked',
  SESSION_TIMEOUT: 'Session timed out',
  AUTHENTICATION_BYPASS_ATTEMPT: 'Blocked sign-in shortcut attempt',
  ROLE_CHANGE: 'User role changed',
  ACCOUNT_STATUS_CHANGE: 'Account status changed',
  ADMIN_PASSWORD_RESET: 'Administrator reset a password',
  BULK_USER_IMPORT: 'Bulk user import',
  PUBLICATION_STATUS_CHANGE: 'Publication status changed',
  FILE_ATTACHMENT: 'File attachment change',
  VISIBILITY_CHANGE: 'Visibility changed',
  CAROUSEL_OPERATION: 'Homepage banner changed',
  ORGCHART_CHANGE: 'Organization chart changed',
  EMAIL_VERIFICATION: 'Email verification',
  API_KEY_GENERATED: 'API key created',
  API_KEY_REVOKED: 'API key removed',
  RATE_LIMIT_CHANGE: 'Rate limit setting changed',
  SECURITY_SETTING_CHANGE: 'Security setting changed',
  BACKUP_CREATED: 'Database backup created',
  BACKUP_RESTORED: 'Database backup restored',
  SCHEMA_MIGRATION: 'Database structure update',
  MAINTENANCE_TASK: 'Maintenance task',
  CRITICAL_ERROR: 'System error recorded',
  PERMISSION_DENIED: 'Access not allowed',
  DATA_VALIDATION_FAILED: 'Information check failed',
  MALWARE_SCAN_ALERT: 'Security scan alert',
};

export function labelForAction(actionType) {
  if (!actionType) return 'Unknown activity';
  return ACTION_LABELS[actionType] || actionType.replace(/_/g, ' ').toLowerCase();
}

export function displayPersonName(log) {
  if (log.full_name && String(log.full_name).trim()) return String(log.full_name).trim();
  if (log.username && String(log.username).trim()) return String(log.username).trim();
  if (log.user_id) return `Staff #${log.user_id}`;
  return 'Guest';
}

export function statusDisplay(status) {
  if (status === 'SUCCESS') return { text: 'Succeeded', tone: 'success' };
  if (status === 'FAILED') return { text: 'Did not succeed', tone: 'danger' };
  return { text: String(status || ''), tone: 'secondary' };
}

/** Yellow “attention” row — security-related but not a hard system error */
export function isAttentionAction(actionType) {
  return (
    actionType === 'PERMISSION_DENIED' ||
    actionType === 'ACCOUNT_LOCKOUT' ||
    actionType === 'AUTHENTICATION_BYPASS_ATTEMPT'
  );
}
