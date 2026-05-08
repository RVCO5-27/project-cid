-- Adds an explicit ordering number for schools so the UI can sort deterministically.
-- Enforces no duplication through a UNIQUE constraint.

-- Add column if missing
SET @display_order_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND COLUMN_NAME = 'display_order'
);

SET @ddl_add := IF(
  @display_order_exists = 0,
  'ALTER TABLE `schools` ADD COLUMN `display_order` int(11) DEFAULT NULL AFTER `school_name`',
  'SELECT 1'
);
PREPARE stmt_add FROM @ddl_add;
EXECUTE stmt_add;
DEALLOCATE PREPARE stmt_add;

-- Backfill existing rows with a stable, unique sequence (only where NULL)
-- Uses a user-variable so it works on MariaDB 10.4 / MySQL 5.7+.
SET @rownum := 0;
UPDATE schools s
JOIN (
  SELECT id, (@rownum := @rownum + 1) AS rn
  FROM schools
  ORDER BY id ASC
) x ON x.id = s.id
SET s.display_order = x.rn
WHERE s.display_order IS NULL;

-- Add UNIQUE constraint if missing
SET @uq_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND INDEX_NAME = 'uq_schools_display_order'
);

SET @ddl_uq := IF(
  @uq_exists = 0,
  'ALTER TABLE `schools` ADD UNIQUE KEY `uq_schools_display_order` (`display_order`)',
  'SELECT 1'
);
PREPARE stmt_uq FROM @ddl_uq;
EXECUTE stmt_uq;
DEALLOCATE PREPARE stmt_uq;

