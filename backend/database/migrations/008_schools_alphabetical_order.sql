-- Schools are ordered alphabetically by school_name in the app.
-- Drop manual ordering constraints on display_order (if present) and allow NULLs.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND COLUMN_NAME = 'display_order'
);

-- Drop unique indexes tied to display_order (names vary by migration history)
SET @idx1 := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND INDEX_NAME = 'uq_schools_type_display_order'
);
SET @ddl_drop1 := IF(@idx1 = 1, 'ALTER TABLE `schools` DROP INDEX `uq_schools_type_display_order`', 'SELECT 1');
PREPARE s1 FROM @ddl_drop1; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @idx2 := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schools'
    AND INDEX_NAME = 'uq_schools_display_order'
);
SET @ddl_drop2 := IF(@idx2 = 1, 'ALTER TABLE `schools` DROP INDEX `uq_schools_display_order`', 'SELECT 1');
PREPARE s2 FROM @ddl_drop2; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Make display_order nullable (ignored by app ordering)
SET @ddl_nullable := IF(
  @col_exists = 1,
  'ALTER TABLE `schools` MODIFY COLUMN `display_order` int(11) DEFAULT NULL',
  'SELECT 1'
);
PREPARE s3 FROM @ddl_nullable; EXECUTE s3; DEALLOCATE PREPARE s3;
