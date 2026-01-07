const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'database.sqlite');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    access TEXT NOT NULL DEFAULT 'PRIVATE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS storage_items (
    id TEXT PRIMARY KEY,
    bucket_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '',
    storage_path TEXT,
    mime_type TEXT,
    size INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bucket_id) REFERENCES buckets(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_storage_items_bucket_id ON storage_items(bucket_id);
  CREATE INDEX IF NOT EXISTS idx_storage_items_path ON storage_items(path);
`);

module.exports = db;
