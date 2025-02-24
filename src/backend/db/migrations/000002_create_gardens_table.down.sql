-- Migration: Drop gardens table and associated objects
-- Dependencies: Requires 000002_create_gardens_table.up.sql to have been run
-- Purpose: Clean removal of gardens table and all related objects within a transaction

BEGIN;

-- Drop trigger first to avoid dependency conflicts
DROP TRIGGER IF EXISTS update_gardens_timestamp ON gardens;

-- Drop indexes in reverse order of creation
DROP INDEX IF EXISTS gardens_soil_sunlight_idx;
DROP INDEX IF EXISTS gardens_deleted_at_idx;
DROP INDEX IF EXISTS gardens_user_id_idx;

-- Drop the gardens table with CASCADE to handle any remaining dependencies
DROP TABLE IF EXISTS gardens CASCADE;

COMMIT;