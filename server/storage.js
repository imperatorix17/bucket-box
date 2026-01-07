const fs = require('fs');
const path = require('path');

const storagePath = process.env.STORAGE_PATH || path.join(__dirname, 'data', 'storage');

// Ensure storage directory exists
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

function getBucketPath(bucketName) {
  return path.join(storagePath, bucketName);
}

function getFilePath(bucketName, itemPath, fileName) {
  const parts = [storagePath, bucketName];
  if (itemPath) {
    parts.push(itemPath);
  }
  parts.push(fileName);
  return path.join(...parts);
}

function ensureBucketExists(bucketName) {
  const bucketPath = getBucketPath(bucketName);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return bucketPath;
}

function ensurePathExists(bucketName, itemPath) {
  const fullPath = path.join(getBucketPath(bucketName), itemPath || '');
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

function saveFile(bucketName, itemPath, fileName, fileBuffer) {
  ensurePathExists(bucketName, itemPath);
  const filePath = getFilePath(bucketName, itemPath, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return filePath;
}

function deleteFile(bucketName, itemPath, fileName) {
  const filePath = getFilePath(bucketName, itemPath, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function deleteFolder(bucketName, itemPath, folderName) {
  const folderPath = path.join(getBucketPath(bucketName), itemPath || '', folderName);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function deleteBucket(bucketName) {
  const bucketPath = getBucketPath(bucketName);
  if (fs.existsSync(bucketPath)) {
    fs.rmSync(bucketPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function getFileStream(bucketName, filePath) {
  const fullPath = path.join(storagePath, bucketName, filePath);
  if (fs.existsSync(fullPath)) {
    return fs.createReadStream(fullPath);
  }
  return null;
}

function fileExists(bucketName, filePath) {
  const fullPath = path.join(storagePath, bucketName, filePath);
  return fs.existsSync(fullPath);
}

module.exports = {
  storagePath,
  getBucketPath,
  getFilePath,
  ensureBucketExists,
  ensurePathExists,
  saveFile,
  deleteFile,
  deleteFolder,
  deleteBucket,
  getFileStream,
  fileExists
};
