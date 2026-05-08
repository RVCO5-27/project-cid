-- Phase 3 Migration: Add School, Issuance, and User Operations Action Types
-- Added 11 new action types for school management, document operations, and user management
-- Migration Date: 2025
-- Status: Production-ready

-- Issuance/Document Operations (4 types)
INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ISSUANCE_CREATE', 'Issuance/document record creation', 'DOCUMENT_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ISSUANCE_CREATE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ISSUANCE_UPDATE', 'Issuance/document record modification', 'DOCUMENT_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ISSUANCE_UPDATE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ISSUANCE_PUBLISH', 'Issuance publication or status change', 'DOCUMENT_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ISSUANCE_PUBLISH');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ISSUANCE_DELETE', 'Issuance archival or deletion', 'DOCUMENT_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ISSUANCE_DELETE');

-- User Management (4 types)
INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'USER_REGISTRATION', 'New user account creation', 'USER_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'USER_REGISTRATION');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'USER_PROFILE_UPDATE', 'User profile or account details modification', 'USER_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'USER_PROFILE_UPDATE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'USER_ACTIVATION', 'User account activated', 'USER_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'USER_ACTIVATION');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'USER_DEACTIVATION', 'User account deactivated', 'USER_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'USER_DEACTIVATION');

-- Analytics & Reports (3 types)
INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'REPORT_GENERATED', 'Report or analytics generated', 'ANALYTICS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'REPORT_GENERATED');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'REPORT_ACCESSED', 'Report or dashboard accessed by user', 'ANALYTICS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'REPORT_ACCESSED');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ANALYTICS_EXPORT', 'Analytics data or report exported', 'ANALYTICS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ANALYTICS_EXPORT');

-- School Operations (noted for Phase 3 but already configured)
INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'SCHOOL_CREATE', 'School record creation', 'SCHOOL_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'SCHOOL_CREATE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'SCHOOL_UPDATE', 'School record modification', 'SCHOOL_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'SCHOOL_UPDATE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'SCHOOL_DELETE', 'School record deletion', 'SCHOOL_OPERATIONS'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'SCHOOL_DELETE');

-- Verify insertion
SELECT COUNT(DISTINCT action_type) as total_action_types FROM audit_action_types;
