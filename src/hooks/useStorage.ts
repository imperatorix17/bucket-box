import * as api from '@/services/api';
import { Bucket, StorageItem } from '@/types/storage';
import { toast } from 'sonner';

export function useStorage() {
  const fetchBuckets = async (): Promise<Bucket[]> => {
    try {
      return await api.fetchBuckets();
    } catch (error) {
      console.error('Error fetching buckets:', error);
      return [];
    }
  };

  const createBucket = async (name: string, access: 'PRIVATE' | 'PUBLIC'): Promise<Bucket | null> => {
    try {
      const bucket = await api.createBucket(name, access);
      toast.success(`Bucket "${name}" created`);
      return bucket;
    } catch (error) {
      console.error('Error creating bucket:', error);
      toast.error('Failed to create bucket');
      return null;
    }
  };

  const fetchItems = async (bucketId: string, path: string = ''): Promise<StorageItem[]> => {
    try {
      return await api.fetchItems(bucketId, path);
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  };

  const createFolder = async (bucketId: string, name: string, path: string = ''): Promise<StorageItem | null> => {
    try {
      const folder = await api.createFolder(bucketId, name, path);
      toast.success(`Folder "${name}" created`);
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  };

  const uploadFile = async (
    bucketId: string,
    _bucketName: string,
    file: File,
    path: string = '',
    onProgress?: (progress: number) => void
  ): Promise<StorageItem | null> => {
    try {
      return await api.uploadFile(bucketId, file, path, onProgress);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const deleteItem = async (item: StorageItem, _bucketName: string): Promise<boolean> => {
    try {
      await api.deleteItem(item.id);
      toast.success(`"${item.name}" deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
      return false;
    }
  };

  const deleteItems = async (items: StorageItem[], _bucketName: string): Promise<boolean> => {
    try {
      for (const item of items) {
        await api.deleteItem(item.id);
      }
      toast.success(`${items.length} items deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete items');
      return false;
    }
  };

  const deleteBucket = async (bucket: { id: string; name: string }): Promise<boolean> => {
    try {
      await api.deleteBucket(bucket.id);
      toast.success(`Bucket "${bucket.name}" deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting bucket:', error);
      toast.error('Failed to delete bucket');
      return false;
    }
  };

  return {
    loading: false,
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
