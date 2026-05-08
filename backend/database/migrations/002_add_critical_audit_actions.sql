-- Migration: Add Critical Audit Actions
-- Purpose: Add Phase 1 critical action types for compliance and security auditing
-- Date: April 16, 2026
-- Applies to: audit_logs table

-- Add session-related and security fields to audit_logs
-- NOTE: Run this AFTER the base audit_logs table is created

-- Step 1: Add new fields to audit_logs if they don't exist
-- (These are optional enhancements that expand tracking capabilities)

ALTER TABLE audit_logs ADD COLUMN reason varchar(255) DEFAULT NULL COMMENT 'Reason for change or action' AFTER description;
ALTER TABLE audit_logs ADD COLUMN approval_id int(11) DEFAULT NULL COMMENT 'ID of admin who approved the action' AFTER reason;
ALTER TABLE audit_logs ADD COLUMN approval_reason varchar(255) DEFAULT NULL COMMENT 'Reason for approval' AFTER approval_id;
ALTER TABLE audit_logs ADD COLUMN impact_level enum('CRITICAL','HIGH','MEDIUM','LOW') DEFAULT 'MEDIUM' COMMENT 'Impact level of the operation' AFTER approval_reason;
ALTER TABLE audit_logs ADD COLUMN duration_ms int(11) DEFAULT NULL COMMENT 'Duration of operation in milliseconds' AFTER impact_level;
ALTER TABLE audit_logs ADD COLUMN session_id varchar(255) DEFAULT NULL COMMENT 'Session ID for correlation' AFTER duration_ms;
ALTER TABLE audit_logs ADD COLUMN request_id varchar(255) DEFAULT NULL COMMENT 'Request ID for tracing' AFTER session_id;
ALTER TABLE audit_logs ADD COLUMN archived_at datetime DEFAULT NULL COMMENT 'When log was archived' AFTER created_at;

-- Step 2: Create indexes on new fields for performance
CREATE INDEX IF NOT EXISTS idx_reason ON audit_logs(reason);
CREATE INDEX IF NOT EXISTS idx_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_impact_level ON audit_logs(impact_level);
CREATE INDEX IF NOT EXISTS idx_approval_id ON audit_logs(approval_id);

-- Step 3: Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_action_timestamp ON audit_logs(action_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_module_timestamp ON audit_logs(module, timestamp);

-- Step 4: Create a view for critical operations (for easy querying)
CREATE OR REPLACE VIEW critical_audit_operations AS
SELECT 
  id,
  user_id,
  action_type,
  status,
  module,
  description,
  resource_type,
  resource_id,
  ip_address,
  timestamp,
  impact_level
FROM audit_logs
WHERE action_type IN (
  'ROLE_CHANGE',
  'ACCOUNT_STATUS_CHANGE',
  'SECURITY_SETTING_CHANGE',
  'BACKUP_CREATED',
  'BACKUP_RESTORED',
  'CRITICAL_ERROR',
  'PERMISSION_DENIED',
  'API_KEY_GENERATED', 
  'API_KEY_REVOKED'
)
ORDER BY timestamp DESC;

-- Step 5: Create a view for failed operations (for security analysis)
CREATE OR REPLACE VIEW failed_audit_operations AS
SELECT 
  id,
  user_id,
  action_type,
  module,
  description,
  resource_type,
  resource_id,
  ip_address,
  timestamp
FROM audit_logs
WHERE status = 'FAILED'
ORDER BY timestamp DESC;

-- Step 6: Verify the expanded action_type enum
-- This list should match the enum in the audit_logs table definition
ALTER TABLE audit_logs 
MODIFY action_type ENUM(
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'UPLOAD',
  'DOWNLOAD',
  'VIEW',
  'PASSWORD_RESET',
  'ACCOUNT_LOCKOUT',
  'SESSION_TIMEOUT',
  'AUTHENTICATION_BYPASS_ATTEMPT',
  'ROLE_CHANGE',
  'ACCOUNT_STATUS_CHANGE',
  'ADMIN_PASSWORD_RESET',
  'BULK_USER_IMPORT',
  'PUBLICATION_STATUS_CHANGE',
  'FILE_ATTACHMENT',
  'VISIBILITY_CHANGE',
  'CAROUSEL_OPERATION',
  'ORGCHART_CHANGE',
  'EMAIL_VERIFICATION',
  'API_KEY_GENERATED',
  'API_KEY_REVOKED',
  'RATE_LIMIT_CHANGE',
  'SECURITY_SETTING_CHANGE',
  'BACKUP_CREATED',
  'BACKUP_RESTORED',
  'SCHEMA_MIGRATION',
  'MAINTENANCE_TASK',
  'CRITICAL_ERROR',
  'PERMISSION_DENIED',
  'DATA_VALIDATION_FAILED',
  'MALWARE_SCAN_ALERT'
) NOT NULL;

-- Step 7: Create stored procedure for audit retention policy
-- Deletes archived logs older than retention period
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS prune_archived_audit_logs(IN retention_days INT)
BEGIN
  DELETE FROM audit_logs
  WHERE archived_at IS NOT NULL
  AND archived_at < DATE_SUB(NOW(), INTERVAL retention_days DAY);
  
  SELECT ROW_COUNT() AS deleted_rows;
END $$

DELIMITER ;

-- Step 8: Create stored procedure for archiving old logs
-- Marks logs as archived when they reach retention age
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS archive_old_audit_logs(IN archive_days INT)
BEGIN
  UPDATE audit_logs
  SET archived_at = NOW()
  WHERE archived_at IS NULL
  AND action_type NOT IN ('ROLE_CHANGE', 'ACCOUNT_STATUS_CHANGE', 'SECURITY_SETTING_CHANGE', 'BACKUP_CREATED', 'BACKUP_RESTORED', 'CRITICAL_ERROR')
  AND timestamp < DATE_SUB(NOW(), INTERVAL archive_days DAY)
  LIMIT 10000;
  
  SELECT ROW_COUNT() AS archived_rows;
END $$

DELIMITER ;

-- Done
SELECT 'Phase 1 Critical Audit Actions schema migration complete' AS status;
