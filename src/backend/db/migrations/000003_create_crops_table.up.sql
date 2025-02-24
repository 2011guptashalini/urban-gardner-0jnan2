-- Create crops table with comprehensive yield tracking and space management
CREATE TABLE crops (
    -- Primary identifier using UUID for distributed system compatibility
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    
    -- Foreign key to gardens table with cascade delete
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Crop details with validation constraints
    name VARCHAR(100) NOT NULL,
    quantity_needed INTEGER NOT NULL 
        CHECK (quantity_needed > 0),
    grow_bags INTEGER NOT NULL 
        CHECK (grow_bags > 0),
    bag_size VARCHAR(20) NOT NULL
        CHECK (bag_size IN ('8 inch', '10 inch', '12 inch', '14 inch', '16 inch')),
    
    -- Yield tracking with high precision
    estimated_yield DECIMAL(10,2) NOT NULL DEFAULT 0.0
        CHECK (estimated_yield >= 0.0),
    
    -- Audit timestamps with timezone awareness
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for optimizing common queries
CREATE INDEX crops_garden_id_idx ON crops (garden_id);
CREATE INDEX crops_deleted_at_idx ON crops (deleted_at);
CREATE INDEX crops_name_idx ON crops (name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crops_timestamp
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comment
COMMENT ON TABLE crops IS 'Stores crop and grow bag information with yield tracking capabilities';

-- Add column comments
COMMENT ON COLUMN crops.id IS 'Unique identifier for the crop record';
COMMENT ON COLUMN crops.garden_id IS 'Reference to the parent garden';
COMMENT ON COLUMN crops.name IS 'Name of the crop variety';
COMMENT ON COLUMN crops.quantity_needed IS 'Required daily yield in grams';
COMMENT ON COLUMN crops.grow_bags IS 'Number of grow bags allocated';
COMMENT ON COLUMN crops.bag_size IS 'Standardized grow bag size specification';
COMMENT ON COLUMN crops.estimated_yield IS 'Calculated daily yield estimate in grams';
COMMENT ON COLUMN crops.created_at IS 'Timestamp of crop record creation';
COMMENT ON COLUMN crops.updated_at IS 'Timestamp of last crop record update';
COMMENT ON COLUMN crops.deleted_at IS 'Soft delete timestamp, NULL indicates active record';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON crops TO web_app;
REVOKE DELETE ON crops FROM web_app;