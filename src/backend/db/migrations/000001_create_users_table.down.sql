-- Begin transaction for atomic rollback
BEGIN;

-- Safety check: Verify no active connections using the users table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_stat_activity 
        WHERE query LIKE '%users%' 
        AND pid != pg_backend_pid()
        AND state = 'active'
    ) THEN
        RAISE EXCEPTION 'Active connections detected on users table';
    END IF;
END $$;

-- Drop timestamp update trigger if exists
DROP TRIGGER IF EXISTS set_timestamp ON users;

-- Drop timestamp update function if exists
DROP FUNCTION IF EXISTS update_timestamp();

-- Drop indexes with safety checks
DO $$
BEGIN
    -- Drop email unique index
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'users_email_idx'
    ) THEN
        DROP INDEX users_email_idx;
    END IF;

    -- Drop deleted_at index
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_deleted_at'
    ) THEN
        DROP INDEX idx_users_deleted_at;
    END IF;
END $$;

-- Safety check: Verify no foreign key references to users table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'users'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Foreign key references to users table still exist';
    END IF;
END $$;

-- Drop the users table if it exists
DROP TABLE IF EXISTS users;

-- Commit the transaction
COMMIT;