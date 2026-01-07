import { Bucket, StorageItem } from '@/types/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API response types (snake_case from backend)
interface ApiBucket {
  id: string;
  name: string;
  access: string;
  created_at: string;
  updated_at: string;
}

interface ApiStorageItem {
  id: string;
  name: string;
  type: string;
  path: string;
  size?: number;
  mime_type?: string;
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

// Get auth credentials from env
function getAuthHeader(): string {
  const username = import.meta.env.VITE_AUTH_USERNAME || 'admin';
  const password = import.meta.env.VITE_AUTH_PASSWORD || 'admin123';
  return 'Basic ' + btoa(`${username}:${password}`);
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': getAuthHeader(),
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response;
}

// Auth
export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Buckets
export async function fetchBuckets(): Promise<Bucket[]> {
  const response = await fetchWithAuth(`${API_URL}/api/buckets`);
  const data: ApiBucket[] = await response.json();
  return data.map(b => ({
    id: b.id,
    name: b.name,
    createdAt: new Date(b.created_at),
    access: b.access as 'PRIVATE' | 'PUBLIC',
    itemCount: 0,
  }));
}

export async function createBucket(name: string, access: 'PRIVATE' | 'PUBLIC'): Promise<Bucket> {
  const response = await fetchWithAuth(`${API_URL}/api/buckets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, access }),
  });
  const data: ApiBucket = await response.json();
  return {
    id: data.id,
    name: data.name,
    createdAt: new Date(data.created_at),
    access: data.access as 'PRIVATE' | 'PUBLIC',
    itemCount: 0,
  };
}

export async function deleteBucket(id: string): Promise<void> {
  await fetchWithAuth(`${API_URL}/api/buckets/${id}`, {
    method: 'DELETE',
  });
}

// Storage Items
export async function fetchItems(bucketId: string, path?: string): Promise<StorageItem[]> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  
  const response = await fetchWithAuth(`${API_URL}/api/buckets/${bucketId}/items?${params}`);
  const data: ApiStorageItem[] = await response.json();
  return data.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type as 'file' | 'folder',
    size: item.size,
    lastModified: new Date(item.updated_at),
    path: item.path,
    mimeType: item.mime_type,
    storagePath: item.storage_path,
  }));
}

export async function createFolder(bucketId: string, name: string, path?: string): Promise<StorageItem> {
  const response = await fetchWithAuth(`${API_URL}/api/buckets/${bucketId}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, path: path || '' }),
  });
  const data: ApiStorageItem = await response.json();
  return {
    id: data.id,
    name: data.name,
    type: 'folder',
    lastModified: new Date(data.updated_at),
    path: data.path,
  };
}

export async function uploadFile(
  bucketId: string,
  file: File,
  path?: string,
  onProgress?: (progress: number) => void
): Promise<StorageItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (path) formData.append('path', path);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data: ApiStorageItem = JSON.parse(xhr.responseText);
        resolve({
          id: data.id,
          name: data.name,
          type: 'file',
          size: data.size,
          lastModified: new Date(data.updated_at),
          path: data.path,
          mimeType: data.mime_type,
          storagePath: data.storage_path,
        });
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', `${API_URL}/api/buckets/${bucketId}/upload`);
    xhr.setRequestHeader('Authorization', getAuthHeader());
    xhr.send(formData);
  });
}

export async function deleteItem(id: string): Promise<void> {
  await fetchWithAuth(`${API_URL}/api/items/${id}`, {
    method: 'DELETE',
  });
}

// File URLs
export function getFileUrl(bucketName: string, filePath: string): string {
  return `${API_URL}/api/files/${bucketName}/${filePath}`;
}
