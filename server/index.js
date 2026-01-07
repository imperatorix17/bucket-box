require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mime = require('mime-types');

const db = require('./database');
const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3001;

// Auth credentials
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin123';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Simple auth middleware (optional - for protected routes)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ==================== BUCKETS ====================

// Get all buckets
app.get('/api/buckets', authMiddleware, (req, res) => {
  try {
    const buckets = db.prepare('SELECT * FROM buckets ORDER BY created_at DESC').all();
    res.json(buckets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bucket
app.post('/api/buckets', authMiddleware, (req, res) => {
  try {
    const { name, access = 'PRIVATE' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Bucket name is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO buckets (id, name, access, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, access, now, now);

    // Create bucket folder on filesystem
    storage.ensureBucketExists(name);

    const bucket = db.prepare('SELECT * FROM buckets WHERE id = ?').get(id);
    res.status(201).json(bucket);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Bucket name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete bucket
app.delete('/api/buckets/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const bucket = db.prepare('SELECT * FROM buckets WHERE id = ?').get(id);
    if (!bucket) {
      return res.status(404).json({ error: 'Bucket not found' });
    }

    // Delete from database (cascade will delete storage_items)
    db.prepare('DELETE FROM buckets WHERE id = ?').run(id);

    // Delete from filesystem
    storage.deleteBucket(bucket.name);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STORAGE ITEMS ====================

// Get items in bucket
app.get('/api/buckets/:id/items', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { path: itemPath = '' } = req.query;

    const items = db.prepare(`
      SELECT * FROM storage_items 
      WHERE bucket_id = ? AND path = ?
      ORDER BY type DESC, name ASC
    `).all(id, itemPath);

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
app.post('/api/buckets/:id/folders', authMiddleware, (req, res) => {
  try {
    const { id: bucketId } = req.params;
    const { name, path: itemPath = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const bucket = db.prepare('SELECT * FROM buckets WHERE id = ?').get(bucketId);
    if (!bucket) {
      return res.status(404).json({ error: 'Bucket not found' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO storage_items (id, bucket_id, name, type, path, created_at, updated_at)
      VALUES (?, ?, ?, 'folder', ?, ?, ?)
    `).run(id, bucketId, name, itemPath, now, now);

    // Create folder on filesystem
    storage.ensurePathExists(bucket.name, itemPath ? `${itemPath}/${name}` : name);

    const folder = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/buckets/:id/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    const { id: bucketId } = req.params;
    const { path: itemPath = '' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const bucket = db.prepare('SELECT * FROM buckets WHERE id = ?').get(bucketId);
    if (!bucket) {
      return res.status(404).json({ error: 'Bucket not found' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const storagePath = itemPath ? `${itemPath}/${file.originalname}` : file.originalname;
    const mimeType = file.mimetype || 'application/octet-stream';

    // Save file to filesystem
    storage.saveFile(bucket.name, itemPath, file.originalname, file.buffer);

    // Save metadata to database
    db.prepare(`
      INSERT INTO storage_items (id, bucket_id, name, type, path, storage_path, mime_type, size, created_at, updated_at)
      VALUES (?, ?, ?, 'file', ?, ?, ?, ?, ?, ?)
    `).run(id, bucketId, file.originalname, itemPath, storagePath, mimeType, file.size, now, now);

    const item = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete item(s)
app.delete('/api/items/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const item = db.prepare(`
      SELECT si.*, b.name as bucket_name 
      FROM storage_items si 
      JOIN buckets b ON si.bucket_id = b.id 
      WHERE si.id = ?
    `).get(id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.type === 'folder') {
      // Delete all items inside the folder
      const folderPath = item.path ? `${item.path}/${item.name}` : item.name;
      db.prepare(`
        DELETE FROM storage_items 
        WHERE bucket_id = ? AND (path = ? OR path LIKE ?)
      `).run(item.bucket_id, folderPath, `${folderPath}/%`);

      // Delete folder from filesystem
      storage.deleteFolder(item.bucket_name, item.path, item.name);
    } else {
      // Delete file from filesystem
      storage.deleteFile(item.bucket_name, item.path, item.name);
    }

    // Delete item from database
    db.prepare('DELETE FROM storage_items WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FILE ACCESS ====================

// Get file (public access for public buckets)
app.get('/api/files/*', (req, res) => {
  try {
    const filePath = req.params[0];
    const pathParts = filePath.split('/');
    const bucketName = pathParts[0];
    const itemPath = pathParts.slice(1).join('/');

    // Check bucket access
    const bucket = db.prepare('SELECT * FROM buckets WHERE name = ?').get(bucketName);
    
    if (!bucket) {
      return res.status(404).json({ error: 'Bucket not found' });
    }

    // For private buckets, require auth
    if (bucket.access === 'PRIVATE') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Check if file exists
    if (!storage.fileExists(bucketName, itemPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get mime type from database or guess from extension
    const fileName = path.basename(itemPath);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    
    const fileStream = storage.getFileStream(bucketName, itemPath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CloudVault server running on port ${PORT}`);
  console.log(`Storage path: ${storage.storagePath}`);
});
