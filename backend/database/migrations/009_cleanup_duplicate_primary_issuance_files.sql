-- 009_cleanup_duplicate_primary_issuance_files.sql
-- Ensures only one primary file link per issuance for existing data.

UPDATE issuance_files t
JOIN (
  SELECT issuance_id, MIN(id) AS keep_id
  FROM issuance_files
  WHERE is_primary = 1
  GROUP BY issuance_id
) k ON k.issuance_id = t.issuance_id
SET t.is_primary = 0
WHERE t.is_primary = 1
  AND t.id <> k.keep_id;
