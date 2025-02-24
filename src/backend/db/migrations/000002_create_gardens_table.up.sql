-- Create gardens table with comprehensive validation and auditing
CREATE TABLE gardens (
    -- Primary identifier with UUID generation
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    
    -- Foreign key to users table with cascade delete
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Garden dimensions with strict validation (1.0 to 1000.0 feet/meters)
    length DECIMAL(10,2) NOT NULL 
        CHECK (length >= 1.0 AND length <= 1000.0)
        CHECK (length > 0),
    width DECIMAL(10,2) NOT NULL 
        CHECK (width >= 1.0 AND width <= 1000.0)
        CHECK (width > 0),
    
    -- Garden characteristics with enumerated valid values
    soil_type VARCHAR(50) NOT NULL
        CHECK (soil_type IN ('red_soil', 'sandy_soil', 'loamy_soil', 'clay_soil', 'black_soil')),
    sunlight VARCHAR(20) NOT NULL
        CHECK (sunlight IN ('full_sun', 'partial_shade', 'full_shade')),
    
    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for optimizing common queries
CREATE INDEX gardens_user_id_idx ON gardens (user_id);
CREATE INDEX gardens_deleted_at_idx ON gardens (deleted_at);
CREATE INDEX gardens_soil_sunlight_idx ON gardens (soil_type, sunlight);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gardens_timestamp
    BEFORE UPDATE ON gardens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comment
COMMENT ON TABLE gardens IS 'Stores garden space information including dimensions, soil type, and sunlight conditions';

-- Add column comments
COMMENT ON COLUMN gardens.id IS 'Unique identifier for the garden';
COMMENT ON COLUMN gardens.user_id IS 'Reference to the garden owner in users table';
COMMENT ON COLUMN gardens.length IS 'Garden length in feet/meters (1.0 to 1000.0)';
COMMENT ON COLUMN gardens.width IS 'Garden width in feet/meters (1.0 to 1000.0)';
COMMENT ON COLUMN gardens.soil_type IS 'Type of soil (red_soil, sandy_soil, loamy_soil, clay_soil, black_soil)';
COMMENT ON COLUMN gardens.sunlight IS 'Sunlight conditions (full_sun, partial_shade, full_shade)';
COMMENT ON COLUMN gardens.created_at IS 'Timestamp of garden record creation';
COMMENT ON COLUMN gardens.updated_at IS 'Timestamp of last garden record update';
COMMENT ON COLUMN gardens.deleted_at IS 'Soft delete timestamp, NULL indicates active record';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON gardens TO web_app;
REVOKE DELETE ON gardens FROM web_app;