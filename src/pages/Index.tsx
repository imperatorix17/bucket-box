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
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { fetchBuckets, createBucket, fetchItems, createFolder, uploadFile } = useStorage();

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load buckets on mount
  useEffect(() => {
    const loadBuckets = async () => {
      const data = await fetchBuckets();
      setBuckets(data);
    };
    if (isAuthenticated) {
      loadBuckets();
    }
  }, [fetchBuckets, isAuthenticated]);

  // Load items when bucket or path changes
  useEffect(() => {
    const loadItems = async () => {
      if (selectedBucket) {
        const data = await fetchItems(selectedBucket.id, currentPath);
        setItems(data);
      } else {
        setItems([]);
      }
    };
    loadItems();
  }, [selectedBucket, currentPath, fetchItems]);

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
  };

  const handleItemClick = (item: StorageItem) => {
    if (item.type === 'folder') {
      setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name);
      setSelectedItems([]);
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
    setSelectedItems([]);
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

  const handleRefresh = async () => {
    if (selectedBucket) {
      const data = await fetchItems(selectedBucket.id, currentPath);
      setItems(data);
    }
  };

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

  if (!isAuthenticated) {
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
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border p-4 flex items-center gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {selectedBucket ? (
            <>
              <BucketHeader
                bucket={selectedBucket}
                breadcrumbs={breadcrumbs}
                onBreadcrumbClick={handleBreadcrumbClick}
                onRefresh={handleRefresh}
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
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                />
              </div>
            </>
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
      </div>
    </FileDropZone>
  );
}
