import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bucket, StorageItem } from '@/types/storage';
import { toast } from 'sonner';

export function useStorage() {
  const [loading, setLoading] = useState(false);

  const fetchBuckets = useCallback(async (): Promise<Bucket[]> => {
    const { data, error } = await supabase
      .from('buckets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching buckets:', error);
      toast.error('Failed to fetch buckets');
      return [];
    }

    return data.map(b => ({
      id: b.id,
      name: b.name,
      createdAt: new Date(b.created_at),
      access: b.access as 'PRIVATE' | 'PUBLIC',
      itemCount: 0, // Will be calculated separately if needed
    }));
  }, []);

  const createBucket = useCallback(async (name: string, access: 'PRIVATE' | 'PUBLIC'): Promise<Bucket | null> => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('buckets')
      .insert({ name, access })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating bucket:', error);
      toast.error('Failed to create bucket');
      return null;
    }

    toast.success(`Bucket "${name}" created`);
    return {
      id: data.id,
      name: data.name,
      createdAt: new Date(data.created_at),
      access: data.access as 'PRIVATE' | 'PUBLIC',
      itemCount: 0,
    };
  }, []);

  const fetchItems = useCallback(async (bucketId: string, path: string = ''): Promise<StorageItem[]> => {
    const { data, error } = await supabase
      .from('storage_items')
      .select('*')
      .eq('bucket_id', bucketId)
      .eq('path', path)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type as 'file' | 'folder',
      size: item.size || undefined,
      lastModified: new Date(item.updated_at),
      path: item.path,
      mimeType: item.mime_type || undefined,
      storagePath: item.storage_path || undefined,
    }));
  }, []);

  const createFolder = useCallback(async (bucketId: string, name: string, path: string = ''): Promise<StorageItem | null> => {
    setLoading(true);

    const { data, error } = await supabase
      .from('storage_items')
      .insert({
        bucket_id: bucketId,
        name,
        type: 'folder',
        path,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }

    toast.success(`Folder "${name}" created`);
    return {
      id: data.id,
      name: data.name,
      type: 'folder',
      lastModified: new Date(data.updated_at),
      path: data.path,
    };
  }, []);

  const uploadFile = useCallback(async (
    bucketId: string,
    bucketName: string,
    file: File,
    path: string = '',
    onProgress?: (progress: number) => void
  ): Promise<StorageItem | null> => {
    const storagePath = path ? `${bucketName}/${path}/${file.name}` : `${bucketName}/${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(uploadError.message);
    }

    // Simulate progress (Supabase doesn't provide real progress)
    onProgress?.(100);

    // Create record in storage_items table
    const { data, error } = await supabase
      .from('storage_items')
      .insert({
        bucket_id: bucketId,
        name: file.name,
        type: 'file',
        path,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating file record:', error);
      throw new Error(error.message);
    }

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
  }, []);

  const deleteItem = useCallback(async (item: StorageItem, bucketName: string): Promise<boolean> => {
    if (item.type === 'file' && item.storagePath) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([item.storagePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('storage_items')
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
      return false;
    }

    toast.success(`"${item.name}" deleted`);
    return true;
  }, []);

  const deleteItems = useCallback(async (items: StorageItem[], bucketName: string): Promise<boolean> => {
    const filesToDelete = items.filter(i => i.type === 'file' && i.storagePath).map(i => i.storagePath!);
    
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove(filesToDelete);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }
    }

    const { error } = await supabase
      .from('storage_items')
      .delete()
      .in('id', items.map(i => i.id));

    if (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete items');
      return false;
    }

    toast.success(`${items.length} items deleted`);
    return true;
  }, []);

  const deleteBucket = useCallback(async (bucket: { id: string; name: string }): Promise<boolean> => {
    // First, get all items in this bucket to delete from storage
    const { data: items } = await supabase
      .from('storage_items')
      .select('*')
      .eq('bucket_id', bucket.id);

    if (items && items.length > 0) {
      const filesToDelete = items
        .filter(i => i.type === 'file' && i.storage_path)
        .map(i => i.storage_path!);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from('user-files').remove(filesToDelete);
      }

      // Delete all items from database
      await supabase.from('storage_items').delete().eq('bucket_id', bucket.id);
    }

    // Delete the bucket
    const { error } = await supabase
      .from('buckets')
      .delete()
      .eq('id', bucket.id);

    if (error) {
      console.error('Error deleting bucket:', error);
      toast.error('Failed to delete bucket');
      return false;
    }

    toast.success(`Bucket "${bucket.name}" deleted`);
    return true;
  }, []);

  return {
    loading,
    fetchBuckets,
    createBucket,
    fetchItems,
    createFolder,
    uploadFile,
    deleteItem,
    deleteItems,
    deleteBucket,
  };
}
