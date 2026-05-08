-- Migration: Enhanced Audit Management Tables
-- Creates comprehensive audit logging tables with categories and retention policies

-- ALTER TABLE audit_logs if it exists to add missing columns
ALTER TABLE `audit_logs` 
ADD COLUMN `category` varchar(50) DEFAULT 'general' AFTER `action_type`,
ADD COLUMN `description` text DEFAULT NULL AFTER `diff_snapshot`,
ADD COLUMN `status` enum('success', 'failure', 'warning') DEFAULT 'success' AFTER `description`,
ADD COLUMN `details` longtext DEFAULT NULL AFTER `status`,
ADD INDEX `idx_audit_category` (`category`),
ADD INDEX `idx_audit_status` (`status`),
ADD INDEX `idx_audit_user_timestamp` (`user_id`, `timestamp`);

-- Create audit_log_categories table for categorization
CREATE TABLE IF NOT EXISTS `audit_log_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(50) NOT NULL UNIQUE,
  `label` varchar(100) NOT NULL,
  `color` varchar(20) DEFAULT '#6b7280',
  `icon` varchar(50) DEFAULT 'file-text',
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT IGNORE INTO `audit_log_categories` (`name`, `label`, `color`, `icon`, `description`) VALUES
('auth', 'Authentication', '#3b82f6', 'lock', 'User login, logout, and authentication events'),
('user', 'User Management', '#8b5cf6', 'users', 'User creation, updates, and deletions'),
('content', 'Content Management', '#10b981', 'file-text', 'Document uploads, edits, and deletions'),
('access', 'Access Control', '#f59e0b', 'shield', 'Permission changes and role assignments'),
('system', 'System', '#6b7280', 'settings', 'System configuration and maintenance'),
('security', 'Security', '#ef4444', 'alert-triangle', 'Security events and suspicious activities'),
('general', 'General', '#6b7280', 'file', 'Other miscellaneous activities');

-- Create audit_log_retention table for managing log retention policies
CREATE TABLE IF NOT EXISTS `audit_log_retention_policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category` varchar(50) NOT NULL UNIQUE,
  `retention_days` int(11) NOT NULL DEFAULT 365,
  `auto_delete` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default retention policies
INSERT IGNORE INTO `audit_log_retention_policies` (`category`, `retention_days`, `auto_delete`, `is_active`) VALUES
('auth', 365, 1, 1),
('user', 730, 1, 1),
('content', 1095, 1, 1),
('access', 365, 1, 1),
('system', 365, 1, 1),
('security', 2555, 0, 1),
('general', 365, 1, 1);

-- Create audit_log_statistics table for tracking aggregate stats
CREATE TABLE IF NOT EXISTS `audit_log_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date` date NOT NULL UNIQUE,
  `total_events` int(11) DEFAULT 0,
  `auth_events` int(11) DEFAULT 0,
  `user_events` int(11) DEFAULT 0,
  `content_events` int(11) DEFAULT 0,
  `access_events` int(11) DEFAULT 0,
  `system_events` int(11) DEFAULT 0,
  `security_events` int(11) DEFAULT 0,
  `failed_events` int(11) DEFAULT 0,
  `warning_events` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit_log_alerts table for triggered alerts
CREATE TABLE IF NOT EXISTS `audit_log_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `audit_log_id` int(11),
  `alert_type` varchar(50) NOT NULL,
  `severity` enum('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `message` text NOT NULL,
  `is_acknowledged` tinyint(1) DEFAULT 0,
  `acknowledged_by` int(11),
  `acknowledged_at` datetime,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  FOREIGN KEY (`audit_log_id`) REFERENCES `audit_logs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`acknowledged_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  INDEX `idx_alert_type` (`alert_type`),
  INDEX `idx_alert_severity` (`severity`),
  INDEX `idx_alert_acknowledged` (`is_acknowledged`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
