import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStorage } from '@/hooks/useStorage';
import { Bucket, StorageItem, BreadcrumbItem } from '@/types/storage';
import { BucketSidebar } from '@/components/storage/BucketSidebar';
import { BucketHeader } from '@/components/storage/BucketHeader';
import { FileTable } from '@/components/storage/FileTable';
import { SearchBar } from '@/components/storage/SearchBar';
import { CreateBucketDialog } from '@/components/storage/CreateBucketDialog';
import { CreateFolderDialog } from '@/components/storage/CreateFolderDialog';
import { EmptyState } from '@/components/storage/EmptyState';
import { FileDropZone } from '@/components/storage/FileDropZone';
import { UploadProgress, UploadItem } from '@/components/storage/UploadProgress';
import { FilePreviewPanel } from '@/components/storage/FilePreviewPanel';
import { DeleteConfirmDialog } from '@/components/storage/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2, Sun, Moon, HelpCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { fetchBuckets, createBucket, fetchItems, createFolder, uploadFile, deleteItem, deleteItems, deleteBucket, updateBucketAccess } = useStorage();

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [previewItem, setPreviewItem] = useState<StorageItem | null>(null);

  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBucketDialogOpen, setDeleteBucketDialogOpen] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState<Bucket | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Redirect to login if not authenticated (after loading check)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load buckets on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBuckets().then(data => setBuckets(data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load items when bucket or path changes
  useEffect(() => {
    if (selectedBucket) {
      fetchItems(selectedBucket.id, currentPath).then(data => setItems(data));
    } else {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBucket?.id, currentPath]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!selectedBucket) return [];

    const crumbs: BreadcrumbItem[] = [
      { label: selectedBucket.name, path: '' }
    ];

    if (currentPath) {
      const parts = currentPath.split('/');
      let accumulatedPath = '';

      parts.forEach((part) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        crumbs.push({ label: part, path: accumulatedPath });
      });
    }

    return crumbs;
  }, [selectedBucket, currentPath]);

  const handleBucketSelect = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
    setSelectedItems([]);
    setSearchQuery('');
    setPreviewItem(null);
  };

  const handleItemClick = (item: StorageItem) => {
    if (item.type === 'folder') {
      setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name);
      setSelectedItems([]);
      setPreviewItem(null);
    }
  };

  const handleItemSelect = (item: StorageItem) => {
    setPreviewItem(item);
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
    setSelectedItems([]);
    setPreviewItem(null);
  };

  const handleCreateBucket = async (name: string, access: 'PRIVATE' | 'PUBLIC') => {
    const newBucket = await createBucket(name, access);
    if (newBucket) {
      setBuckets(prev => [newBucket, ...prev]);
      setSelectedBucket(newBucket);
      setCurrentPath('');
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (!selectedBucket) return;
    const newFolder = await createFolder(selectedBucket.id, name, currentPath);
    if (newFolder) {
      setItems(prev => [...prev, newFolder]);
    }
  };

  const handleFilesDropped = useCallback(async (files: File[]) => {
    if (!selectedBucket) return;

    const newUploads: UploadItem[] = files.map(file => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = newUploads[i].id;

      try {
        const newItem = await uploadFile(
          selectedBucket.id,
          selectedBucket.name,
          file,
          currentPath,
          (progress) => {
            setUploads(prev =>
              prev.map(u => u.id === uploadId ? { ...u, progress } : u)
            );
          }
        );

        setUploads(prev =>
          prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u)
        );

        if (newItem) {
          setItems(prev => [...prev, newItem]);
        }
      } catch (error) {
        setUploads(prev =>
          prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: (error as Error).message } : u)
        );
      }
    }
  }, [selectedBucket, currentPath, uploadFile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dismissUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const dismissAllUploads = () => {
    setUploads([]);
  };

  const handleDeleteSelected = async () => {
    if (!selectedBucket || selectedItems.length === 0) return;
    setDeleteLoading(true);
    
    const itemsToDelete = items.filter(i => selectedItems.includes(i.id));
    const success = await deleteItems(itemsToDelete, selectedBucket.name);
    
    if (success) {
      setItems(prev => prev.filter(i => !selectedItems.includes(i.id)));
      setSelectedItems([]);
      setPreviewItem(null);
    }
    
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
  };

  const handleDeletePreviewItem = async () => {
    if (!selectedBucket || !previewItem) return;
    setDeleteLoading(true);
    
    const success = await deleteItem(previewItem, selectedBucket.name);
    
    if (success) {
      setItems(prev => prev.filter(i => i.id !== previewItem.id));
      setPreviewItem(null);
    }
    
    setDeleteLoading(false);
  };

  const handleDeleteBucket = async () => {
    if (!bucketToDelete) return;
    setDeleteLoading(true);
    
    const success = await deleteBucket(bucketToDelete);
    
    if (success) {
      setBuckets(prev => prev.filter(b => b.id !== bucketToDelete.id));
      if (selectedBucket?.id === bucketToDelete.id) {
        setSelectedBucket(null);
        setItems([]);
        setPreviewItem(null);
      }
    }
    
    setDeleteLoading(false);
    setDeleteBucketDialogOpen(false);
    setBucketToDelete(null);
  };

  const handleBucketDelete = (bucket: Bucket) => {
    setBucketToDelete(bucket);
    setDeleteBucketDialogOpen(true);
  };

  const handleToggleBucketAccess = async (bucket: Bucket) => {
    const newAccess = bucket.access === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    const updated = await updateBucketAccess(bucket.id, newAccess);
    if (updated) {
      setBuckets(prev => prev.map(b => b.id === bucket.id ? updated : b));
      if (selectedBucket?.id === bucket.id) {
        setSelectedBucket(updated);
      }
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <FileDropZone onFilesDropped={handleFilesDropped} disabled={!selectedBucket}>
      <div className="h-screen flex bg-background">
        <BucketSidebar
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelectBucket={handleBucketSelect}
          onCreateBucket={() => setCreateBucketOpen(true)}
          onDeleteBucket={handleBucketDelete}
          onToggleBucketAccess={handleToggleBucketAccess}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border p-3 flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Object Browser</span>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <Button variant="ghost" size="icon" className="shrink-0" title="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {selectedBucket ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                <BucketHeader
                  bucket={selectedBucket}
                  breadcrumbs={breadcrumbs}
                  onBreadcrumbClick={handleBreadcrumbClick}
                  onUpload={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) {
                        handleFilesDropped(files);
                      }
                    };
                    input.click();
                  }}
                  onCreateFolder={() => setCreateFolderOpen(true)}
                />

                <div className="flex-1 overflow-auto p-4">
                  <FileTable
                    items={filteredItems}
                    onItemClick={handleItemClick}
                    onItemSelect={handleItemSelect}
                    selectedItems={selectedItems}
                    onSelectionChange={setSelectedItems}
                    onDeleteSelected={() => setDeleteDialogOpen(true)}
                  />
                </div>
              </div>

              <FilePreviewPanel
                item={previewItem}
                bucket={selectedBucket}
                onClose={() => setPreviewItem(null)}
                onDelete={handleDeletePreviewItem}
              />
            </div>
          ) : (
            <EmptyState onCreateBucket={() => setCreateBucketOpen(true)} />
          )}
        </div>

        <UploadProgress
          uploads={uploads}
          onDismiss={dismissUpload}
          onDismissAll={dismissAllUploads}
        />

        <CreateBucketDialog
          open={createBucketOpen}
          onOpenChange={setCreateBucketOpen}
          onSubmit={handleCreateBucket}
        />

        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          onSubmit={handleCreateFolder}
          currentPath={currentPath}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete selected items?"
          description={`Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`}
          onConfirm={handleDeleteSelected}
          loading={deleteLoading}
        />

        <DeleteConfirmDialog
          open={deleteBucketDialogOpen}
          onOpenChange={setDeleteBucketDialogOpen}
          title={`Delete bucket "${bucketToDelete?.name}"?`}
          description="This will permanently delete the bucket and all its contents. This action cannot be undone."
          onConfirm={handleDeleteBucket}
          loading={deleteLoading}
        />
      </div>
    </FileDropZone>
  );
}
