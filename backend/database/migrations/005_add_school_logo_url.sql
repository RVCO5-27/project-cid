-- Adds per-school logo support
-- Safe to run once; no-op if column exists

-- mysql2's prepared-statement protocol doesn't affect this file; this is pure SQL.
-- Make it idempotent across MySQL/MariaDB versions by checking INFORMATION_SCHEMA.

SET @logo_url_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND COLUMN_NAME = 'logo_url'
);

SET @ddl := IF(
  @logo_url_exists = 0,
  'ALTER TABLE `schools` ADD COLUMN `logo_url` varchar(255) DEFAULT NULL AFTER `school_name`',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

