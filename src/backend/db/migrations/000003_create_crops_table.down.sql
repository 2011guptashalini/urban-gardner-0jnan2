-- Drop foreign key constraint first to prevent dependency conflicts
DROP CONSTRAINT IF EXISTS fk_crops_garden;

-- Drop indexes in order of least to most critical
DROP INDEX IF EXISTS idx_crops_garden_id;
DROP INDEX IF EXISTS idx_crops_deleted_at;

-- Drop the crops table with CASCADE to ensure complete cleanup
DROP TABLE IF EXISTS crops CASCADE;