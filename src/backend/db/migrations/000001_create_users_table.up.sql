-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE UNIQUE INDEX users_email_idx ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX users_deleted_at_idx ON users (deleted_at);

-- Create trigger for updating timestamp
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Add table comment
COMMENT ON TABLE users IS 'Stores user authentication and profile information for the Urban Gardening Assistant application';

-- Add column comments
COMMENT ON COLUMN users.id IS 'Unique identifier for user';
COMMENT ON COLUMN users.email IS 'User''s email address with format validation';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of user''s password';
COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name';
COMMENT ON COLUMN users.created_at IS 'Timestamp of user creation';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last user update';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp for soft delete';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON users TO web_app;
REVOKE DELETE ON users FROM web_app;