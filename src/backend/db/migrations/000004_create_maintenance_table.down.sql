-- Drop indexes first to ensure clean removal
DROP INDEX IF EXISTS maintenance_crop_id_idx;
DROP INDEX IF EXISTS maintenance_next_scheduled_time_idx;
DROP INDEX IF EXISTS maintenance_task_type_idx;
DROP INDEX IF EXISTS maintenance_deleted_at_idx;

-- Drop the trigger before dropping the table
DROP TRIGGER IF EXISTS update_maintenance_timestamp ON maintenance;

-- Drop the maintenance table with CASCADE to remove all dependencies
DROP TABLE IF EXISTS maintenance CASCADE;