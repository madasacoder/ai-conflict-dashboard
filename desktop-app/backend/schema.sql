-- AI Conflict Dashboard Desktop - SQLite Schema
-- Version: 1.0
-- Purpose: Store user workflows, analysis history, and settings
-- Design: Simple, user-focused, easy to backup/restore

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Workflows table: Store user-created analysis workflows
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),  -- UUID-like ID
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🔄',  -- Fun emoji icon for the workflow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    execution_count INTEGER DEFAULT 0,  -- Track usage for popular workflows
    last_executed_at TIMESTAMP,
    -- User-friendly metadata
    tags TEXT,  -- Comma-separated tags for organization
    color TEXT DEFAULT '#3498db'  -- Workflow color in UI
);

-- Workflow nodes: Each step in a workflow (model analysis, comparison, etc.)
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL,  -- 'llm_analysis', 'comparison', 'summarize', etc.
    position_x REAL DEFAULT 0,  -- For visual workflow builder
    position_y REAL DEFAULT 0,
    -- Configuration as JSON for flexibility
    config TEXT NOT NULL DEFAULT '{}',  -- JSON: model selections, prompts, etc.
    -- Connections
    parent_node_id TEXT,  -- Previous node in the flow
    execution_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_node_id) REFERENCES workflow_nodes(id) ON DELETE SET NULL
);

-- Analysis history: Track all analyses for user reference
CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workflow_id TEXT,  -- NULL for one-off analyses
    workflow_name TEXT,  -- Denormalized for quick display
    input_text TEXT NOT NULL,
    input_files TEXT,  -- JSON array of file names
    -- Results
    results TEXT NOT NULL,  -- JSON: all model responses
    consensus TEXT,  -- Extracted consensus
    conflicts TEXT,  -- JSON: detected conflicts
    execution_time_ms INTEGER,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    starred BOOLEAN DEFAULT 0,  -- User can star important analyses
    notes TEXT,  -- User notes on the analysis
    tags TEXT,  -- Comma-separated tags
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
);

-- API keys: Secure local storage
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    provider TEXT NOT NULL UNIQUE,  -- 'openai', 'claude', 'gemini', etc.
    encrypted_key TEXT NOT NULL,  -- Encrypted with user's master key
    is_active BOOLEAN DEFAULT 1,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences: Application settings
CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quick access: Recently used items for better UX
CREATE TABLE IF NOT EXISTS recent_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    item_type TEXT NOT NULL,  -- 'workflow', 'analysis', 'file'
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,  -- Denormalized for display
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    UNIQUE(item_type, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id, execution_order);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_starred ON analysis_history(starred, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_items_accessed ON recent_items(accessed_at DESC);

-- Triggers to auto-update timestamps
CREATE TRIGGER IF NOT EXISTS update_workflows_timestamp 
AFTER UPDATE ON workflows
BEGIN
    UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_api_keys_timestamp 
AFTER UPDATE ON api_keys
BEGIN
    UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_preferences_timestamp 
AFTER UPDATE ON preferences
BEGIN
    UPDATE preferences SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- Initial data: Default preferences
INSERT OR IGNORE INTO preferences (key, value) VALUES 
    ('theme', 'dark'),
    ('auto_save', 'true'),
    ('analysis_timeout_seconds', '30'),
    ('max_tokens_per_model', '2000'),
    ('enable_telemetry', 'false'),
    ('backup_enabled', 'true'),
    ('backup_retention_days', '7');

-- Version tracking for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version) VALUES (1);