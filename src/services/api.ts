import { supabase } from '@/integrations/supabase/client';
import { Bucket, StorageItem } from '@/types/storage';

// Auth - now uses simple local auth (kept for compatibility)
export async function login(username: string, password: string): Promise<boolean> {
  // This is handled by AuthContext now
  return true;
}

// Buckets
export async function fetchBuckets(): Promise<Bucket[]> {
  const { data, error } = await supabase
    .from('buckets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(b => ({
    id: b.id,
    name: b.name,
    createdAt: new Date(b.created_at),
    access: b.access as 'PRIVATE' | 'PUBLIC',
    itemCount: 0,
  }));
}

export async function createBucket(name: string, access: 'PRIVATE' | 'PUBLIC'): Promise<Bucket> {
  const { data, error } = await supabase
    .from('buckets')
    .insert({ name, access })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    createdAt: new Date(data.created_at),
    access: data.access as 'PRIVATE' | 'PUBLIC',
    itemCount: 0,
  };
}

export async function deleteBucket(id: string): Promise<void> {
  // First delete all items in the bucket
  const { error: itemsError } = await supabase
    .from('storage_items')
    .delete()
    .eq('bucket_id', id);

  if (itemsError) throw itemsError;

  // Then delete the bucket
  const { error } = await supabase
    .from('buckets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Storage Items
export async function fetchItems(bucketId: string, path?: string): Promise<StorageItem[]> {
  const { data, error } = await supabase
    .from('storage_items')
    .select('*')
    .eq('bucket_id', bucketId)
    .eq('path', path || '')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    type: item.type as 'file' | 'folder',
    size: item.size || undefined,
    lastModified: new Date(item.updated_at),
    path: item.path,
    mimeType: item.mime_type || undefined,
    storagePath: item.storage_path || undefined,
  }));
}

export async function createFolder(bucketId: string, name: string, path?: string): Promise<StorageItem> {
  const { data, error } = await supabase
    .from('storage_items')
    .insert({
      bucket_id: bucketId,
      name,
      type: 'folder',
      path: path || '',
    })
    .select()
    .single();

  if (error) throw error;

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
  // Get bucket name for storage path
  const { data: bucket, error: bucketError } = await supabase
    .from('buckets')
    .select('name')
    .eq('id', bucketId)
    .single();

  if (bucketError) throw bucketError;

  // Create unique storage path
  const timestamp = Date.now();
  const storagePath = path 
    ? `${bucket.name}/${path}/${timestamp}_${file.name}`
    : `${bucket.name}/${timestamp}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('user-files')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Simulate progress since Supabase doesn't provide it natively
  if (onProgress) {
    onProgress(100);
  }

  // Create database record
  const { data, error } = await supabase
    .from('storage_items')
    .insert({
      bucket_id: bucketId,
      name: file.name,
      type: 'file',
      path: path || '',
      size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    type: 'file',
    size: data.size || undefined,
    lastModified: new Date(data.updated_at),
    path: data.path,
    mimeType: data.mime_type || undefined,
    storagePath: data.storage_path || undefined,
  };
}

export async function deleteItem(id: string): Promise<void> {
  // Get item info first
  const { data: item, error: fetchError } = await supabase
    .from('storage_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // If it's a file with storage_path, delete from storage
  if (item.type === 'file' && item.storage_path) {
    await supabase.storage
      .from('user-files')
      .remove([item.storage_path]);
  }

  // If it's a folder, delete all items inside it recursively
  if (item.type === 'folder') {
    const folderPath = item.path ? `${item.path}/${item.name}` : item.name;
    
    // Get all items in this folder
    const { data: children } = await supabase
      .from('storage_items')
      .select('id')
      .eq('bucket_id', item.bucket_id)
      .like('path', `${folderPath}%`);

    if (children && children.length > 0) {
      for (const child of children) {
        await deleteItem(child.id);
      }
    }
  }

  // Delete the item record
  const { error } = await supabase
    .from('storage_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// File URLs
export function getFileUrl(bucketName: string, filePath: string): string {
  const { data } = supabase.storage
    .from('user-files')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
