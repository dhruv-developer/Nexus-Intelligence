-- Initialize PostgreSQL database for Nexus Intelligence
-- This script runs when the container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- The user and database are created by the PostgreSQL container's environment variables

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nexus_intelligence TO nexus_user;
