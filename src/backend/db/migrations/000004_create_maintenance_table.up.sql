-- Create maintenance table for garden task scheduling and tracking
CREATE TABLE maintenance (
    -- Primary identifier using UUID for distributed system compatibility
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    
    -- Foreign key to crops table with cascade delete
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    
    -- Task specifications with validation constraints
    task_type VARCHAR(50) NOT NULL
        CHECK (task_type IN ('Fertilizer', 'Water', 'Composting')),
    frequency VARCHAR(20) NOT NULL
        CHECK (frequency IN ('Daily', 'Weekly', 'Bi-weekly')),
    amount DECIMAL(10,2) NOT NULL
        CHECK (amount > 0),
    unit VARCHAR(20) NOT NULL
        CHECK (unit IN ('ml', 'g', 'oz', 'fl oz')),
    preferred_time VARCHAR(5) NOT NULL
        CHECK (preferred_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    
    -- AI recommendation tracking
    ai_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Schedule tracking with timezone support
    next_scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_completed_time TIMESTAMP WITH TIME ZONE,
    
    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for optimizing common queries
CREATE INDEX maintenance_crop_id_idx ON maintenance (crop_id);
CREATE INDEX maintenance_next_scheduled_time_idx ON maintenance (next_scheduled_time) 
    WHERE deleted_at IS NULL AND active = TRUE;
CREATE INDEX maintenance_task_type_idx ON maintenance (task_type) 
    WHERE deleted_at IS NULL;
CREATE INDEX maintenance_deleted_at_idx ON maintenance (deleted_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_timestamp
    BEFORE UPDATE ON maintenance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comment
COMMENT ON TABLE maintenance IS 'Stores garden maintenance tasks and schedules with AI recommendations tracking';

-- Add column comments
COMMENT ON COLUMN maintenance.id IS 'Unique identifier for the maintenance task';
COMMENT ON COLUMN maintenance.crop_id IS 'Reference to the crop requiring maintenance';
COMMENT ON COLUMN maintenance.task_type IS 'Type of maintenance task (Fertilizer, Water, Composting)';
COMMENT ON COLUMN maintenance.frequency IS 'Task frequency (Daily, Weekly, Bi-weekly)';
COMMENT ON COLUMN maintenance.amount IS 'Quantity of maintenance item to apply';
COMMENT ON COLUMN maintenance.unit IS 'Unit of measurement (ml, g, oz, fl oz)';
COMMENT ON COLUMN maintenance.preferred_time IS 'Preferred time of day for task in HH:MM format';
COMMENT ON COLUMN maintenance.ai_recommended IS 'Indicates if task was AI-recommended';
COMMENT ON COLUMN maintenance.active IS 'Indicates if task is currently active';
COMMENT ON COLUMN maintenance.next_scheduled_time IS 'Next scheduled execution time';
COMMENT ON COLUMN maintenance.last_completed_time IS 'Last completion time of the task';
COMMENT ON COLUMN maintenance.created_at IS 'Timestamp of task creation';
COMMENT ON COLUMN maintenance.updated_at IS 'Timestamp of last task update';
COMMENT ON COLUMN maintenance.deleted_at IS 'Soft delete timestamp';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON maintenance TO web_app;
REVOKE DELETE ON maintenance FROM web_app;