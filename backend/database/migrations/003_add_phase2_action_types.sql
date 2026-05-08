-- Phase 2 Migration: Add Carousel, Organizational Chart, and Document Action Types
-- Added 5 new action types for enhanced audit coverage
-- Migration Date: 2025
-- Status: Pre-production

-- Add new action types to support Phase 2 content management logging
INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'CAROUSEL_OPERATION', 'Carousel slide creation, update, or deletion', 'CONTENT_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'CAROUSEL_OPERATION');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'ORGCHART_CHANGE', 'Organizational chart update or modification', 'CONTENT_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'ORGCHART_CHANGE');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'DOCUMENT_UPLOAD', 'Document file upload to system', 'DOCUMENT_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'DOCUMENT_UPLOAD');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'DOCUMENT_DOWNLOAD', 'Document file download from system', 'DOCUMENT_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'DOCUMENT_DOWNLOAD');

INSERT INTO audit_action_types (action_type, description, category) 
SELECT 'DOCUMENT_DELETE', 'Document file deletion from system', 'DOCUMENT_MANAGEMENT'
WHERE NOT EXISTS (SELECT 1 FROM audit_action_types WHERE action_type = 'DOCUMENT_DELETE');

-- Verify insertion
SELECT COUNT(DISTINCT action_type) as total_action_types FROM audit_action_types;
