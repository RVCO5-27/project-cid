-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 06, 2026 at 04:12 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shs`
--
CREATE DATABASE IF NOT EXISTS `shs`;
USE `shs`;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
-- This table handles all authentication, roles, and profile data for header display
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL COMMENT 'DepEd email for recovery',
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('SuperAdmin','Admin') NOT NULL DEFAULT 'Admin',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `avatar_url` varchar(255) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `prefix` varchar(10) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `color_code` varchar(20) DEFAULT '#000000',
  `icon` varchar(50) DEFAULT 'folder',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `originalname` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `folders`
--

CREATE TABLE `folders` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `is_immutable` tinyint(1) DEFAULT 0 COMMENT '1 for year folders to preserve permalinks',
  `status` enum('active','archived','restricted') DEFAULT 'active',
  `visibility` enum('public','private') DEFAULT 'private',
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categories`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------------

--
-- Table structure for table `issuances`
--

CREATE TABLE `issuances` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `folder_id` int(11) DEFAULT NULL,
  `doc_number` varchar(50) NOT NULL,
  `series_year` int(11) NOT NULL,
  `title` text NOT NULL,
  `description` text DEFAULT NULL,
  `date_issued` date DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `signatory` varchar(150) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT 'default.pdf',
  `file_size` bigint(20) DEFAULT 0,
  `file_type` varchar(50) DEFAULT 'application/pdf',
  `thumbnail_path` varchar(255) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `jurisdiction` varchar(100) DEFAULT 'Division',
  `status` enum('draft','scheduled','published','archived') DEFAULT 'published',
  `scheduled_at` datetime DEFAULT NULL,
  `version_number` int(11) DEFAULT 1,
  `view_count` int(11) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `is_archived` tinyint(1) DEFAULT 0,
  `full_text_content` longtext DEFAULT NULL COMMENT 'For OCR content indexing',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- --------------------------------------------------------

--
-- Table structure for table `issuance_versions`
--

CREATE TABLE `issuance_versions` (
  `id` int(11) NOT NULL,
  `issuance_id` int(11) NOT NULL,
  `version_number` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` bigint(20) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `change_log` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `issuance_files`
--

CREATE TABLE `issuance_files` (
  `id` int(11) NOT NULL,
  `issuance_id` int(11) NOT NULL,
  `file_id` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `attempt_count` int(11) NOT NULL DEFAULT 0,
  `last_attempt_time` datetime DEFAULT NULL,
  `lock_until` datetime DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_recovery`
--

CREATE TABLE `login_recovery` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_searches`
--

CREATE TABLE `saved_searches` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `query_params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`query_params`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','UPLOAD','DOWNLOAD','VIEW','PASSWORD_RESET','ACCOUNT_LOCKOUT','SESSION_TIMEOUT','AUTHENTICATION_BYPASS_ATTEMPT','ROLE_CHANGE','ACCOUNT_STATUS_CHANGE','ADMIN_PASSWORD_RESET','BULK_USER_IMPORT','PUBLICATION_STATUS_CHANGE','FILE_ATTACHMENT','VISIBILITY_CHANGE','CAROUSEL_OPERATION','ORGCHART_CHANGE','EMAIL_VERIFICATION','API_KEY_GENERATED','API_KEY_REVOKED','RATE_LIMIT_CHANGE','SECURITY_SETTING_CHANGE','BACKUP_CREATED','BACKUP_RESTORED','SCHEMA_MIGRATION','MAINTENANCE_TASK','CRITICAL_ERROR','PERMISSION_DENIED','DATA_VALIDATION_FAILED','MALWARE_SCAN_ALERT') NOT NULL,
  `status` enum('SUCCESS','FAILED') DEFAULT 'SUCCESS',
  `module` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `resource_type` varchar(50) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `old_value` longtext DEFAULT NULL,
  `new_value` longtext DEFAULT NULL,
  `diff_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`diff_snapshot`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_status` (`status`),
  KEY `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `carousel_slides`
--

CREATE TABLE `carousel_slides` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `cta_text` varchar(50) DEFAULT NULL,
  `cta_link` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organizational_chart`
--

CREATE TABLE `organizational_chart` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `caption` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` int(11) NOT NULL,
  `school_id` varchar(50) NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `principal_name` varchar(255) NOT NULL,
  `designation` varchar(100) NOT NULL,
  `year_started` int(11) NOT NULL,
  `school_type` enum('Public','Private') NOT NULL DEFAULT 'Public',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_admin_email` (`email`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_file_name` (`filename`),
  ADD KEY `fk_files_admin` (`uploaded_by`);

--
-- Indexes for table `folders`
--
ALTER TABLE `folders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_folders_parent_status` (`parent_id`,`status`),
  ADD KEY `idx_folders_owner` (`owner_id`);
ALTER TABLE `folders` ADD FULLTEXT KEY `idx_folder_fulltext` (`name`,`description`);

--
-- Indexes for table `issuances`
--
ALTER TABLE `issuances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_issuances_folder_status` (`folder_id`,`status`,`deleted_at`),
  ADD KEY `idx_issuances_pagination` (`id`);
ALTER TABLE `issuances` ADD FULLTEXT KEY `idx_fulltext_search` (`title`,`tags`,`full_text_content`);

--
-- Indexes for table `organizational_chart`
--
ALTER TABLE `organizational_chart`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `issuance_versions`
--
ALTER TABLE `issuance_versions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `issuance_id` (`issuance_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `issuance_files`
--
ALTER TABLE `issuance_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_issuance_files_lookup` (`issuance_id`,`is_primary`),
  ADD KEY `fk_issuance_files_file` (`file_id`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_login_attempts_admin` (`admin_id`);

--
-- Indexes for table `login_recovery`
--
ALTER TABLE `login_recovery`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_login_recovery_token` (`token`),
  ADD KEY `idx_login_recovery_admin` (`admin_id`);

--
-- Indexes for table `saved_searches`
--
ALTER TABLE `saved_searches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_module` (`module`),
  ADD KEY `idx_audit_timestamp` (`timestamp`),
  ADD KEY `fk_audit_logs_admin` (`user_id`);

--
-- Indexes for table `carousel_slides`
--
ALTER TABLE `carousel_slides`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carousel_sort` (`sort_order`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `school_id` (`school_id`),
  ADD KEY `idx_school_name` (`school_name`),
  ADD KEY `fk_schools_admin` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `folders`
--
ALTER TABLE `folders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `issuances`
--
ALTER TABLE `issuances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `organizational_chart`
--
ALTER TABLE `organizational_chart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `issuance_versions`
--
ALTER TABLE `issuance_versions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `issuance_files`
--
ALTER TABLE `issuance_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_recovery`
--
ALTER TABLE `login_recovery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_searches`
--
ALTER TABLE `saved_searches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `carousel_slides`
--
ALTER TABLE `carousel_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `fk_files_admin` FOREIGN KEY (`uploaded_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `folders`
--
ALTER TABLE `folders`
  ADD CONSTRAINT `fk_folders_owner` FOREIGN KEY (`owner_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `folders_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `folders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `issuances`
--
ALTER TABLE `issuances`
  ADD CONSTRAINT `fk_issuances_folder` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `issuances_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `issuance_versions`
--
ALTER TABLE `issuance_versions`
  ADD CONSTRAINT `issuance_versions_ibfk_1` FOREIGN KEY (`issuance_id`) REFERENCES `issuances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `issuance_versions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `issuance_files`
--
ALTER TABLE `issuance_files`
  ADD CONSTRAINT `fk_issuance_files_file` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_issuance_files_issuance` FOREIGN KEY (`issuance_id`) REFERENCES `issuances` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD CONSTRAINT `fk_login_attempts_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_recovery`
--
ALTER TABLE `login_recovery`
  ADD CONSTRAINT `fk_login_recovery_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_searches`
--
ALTER TABLE `saved_searches`
  ADD CONSTRAINT `saved_searches_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_admin` FOREIGN KEY (`user_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `schools`
--
ALTER TABLE `schools`
  ADD CONSTRAINT `fk_schools_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;