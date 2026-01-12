-- Migration: Add status and last_used fields to agents table
-- Date: 2026-01-11
-- Description: Adds UI compatibility fields for agent status tracking

-- Add status column (default: 'active')
ALTER TABLE agents 
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Add last_used column (nullable)
ALTER TABLE agents 
ADD COLUMN last_used TIMESTAMP NULL;

-- Add comment for documentation
COMMENT ON COLUMN agents.status IS 'Agent status: active, inactive, or draft';
COMMENT ON COLUMN agents.last_used IS 'Timestamp of last query to this agent';

-- Set existing agents to 'active' status
UPDATE agents 
SET status = 'active' 
WHERE status IS NULL;

-- Optional: Set last_used based on latest query if any
UPDATE agents a
SET last_used = (
    SELECT MAX(q.timestamp)
    FROM queries q
    WHERE q.agent_id = a.id
)
WHERE EXISTS (
    SELECT 1 FROM queries q WHERE q.agent_id = a.id
);
