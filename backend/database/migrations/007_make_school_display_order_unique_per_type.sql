-- Make schools.display_order unique per school_type (Public/Private),
-- so both types can have their own independent ordering (e.g., Public #1 and Private #1).

-- Drop old unique index on display_order if it exists
SET @old_uq_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND INDEX_NAME = 'uq_schools_display_order'
);

SET @ddl_drop_old := IF(
  @old_uq_exists = 1,
  'ALTER TABLE `schools` DROP INDEX `uq_schools_display_order`',
  'SELECT 1'
);
PREPARE stmt_drop_old FROM @ddl_drop_old;
EXECUTE stmt_drop_old;
DEALLOCATE PREPARE stmt_drop_old;

-- Add composite unique index (school_type, display_order) if missing
SET @new_uq_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND INDEX_NAME = 'uq_schools_type_display_order'
);

SET @ddl_add_new := IF(
  @new_uq_exists = 0,
  'ALTER TABLE `schools` ADD UNIQUE KEY `uq_schools_type_display_order` (`school_type`, `display_order`)',
  'SELECT 1'
);
PREPARE stmt_add_new FROM @ddl_add_new;
EXECUTE stmt_add_new;
DEALLOCATE PREPARE stmt_add_new;

