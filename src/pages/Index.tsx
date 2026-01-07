import { useState, useMemo } from 'react';
import { Bucket, StorageItem, BreadcrumbItem } from '@/types/storage';
import { mockBuckets, getItemsForPath } from '@/data/mockData';
import { BucketSidebar } from '@/components/storage/BucketSidebar';
import { BucketHeader } from '@/components/storage/BucketHeader';
import { SearchBar } from '@/components/storage/SearchBar';
import { FileTable } from '@/components/storage/FileTable';
import { EmptyState } from '@/components/storage/EmptyState';
import { CreateBucketDialog } from '@/components/storage/CreateBucketDialog';
import { CreateFolderDialog } from '@/components/storage/CreateFolderDialog';
import { toast } from 'sonner';

const Index = () => {
  const [buckets, setBuckets] = useState<Bucket[]>(mockBuckets);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Get items for current location
  const items = useMemo(() => {
    if (!selectedBucket) return [];
    return getItemsForPath(selectedBucket.name, currentPath);
  }, [selectedBucket, currentPath]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (!selectedBucket) return [];
    
    const crumbs: BreadcrumbItem[] = [
      { name: selectedBucket.name, path: '' }
    ];

    if (currentPath) {
      const parts = currentPath.split('/');
      let path = '';
      parts.forEach((part) => {
        path = path ? `${path}/${part}` : part;
        crumbs.push({ name: part, path });
      });
    }

    return crumbs;
  }, [selectedBucket, currentPath]);

  const handleSelectBucket = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
    setSelectedItems([]);
    setSearchQuery('');
  };

  const handleItemClick = (item: StorageItem) => {
    if (item.type === 'folder') {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      setCurrentPath(newPath);
      setSelectedItems([]);
    } else {
      toast.info(`File: ${item.name}`);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedItems([]);
  };

  const handleCreateBucket = (name: string, access: 'PRIVATE' | 'PUBLIC') => {
    const newBucket: Bucket = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      access,
      itemCount: 0,
    };
    setBuckets([...buckets, newBucket]);
    setSelectedBucket(newBucket);
    setCurrentPath('');
    toast.success(`Bucket "${name}" created successfully!`);
  };

  const handleCreateFolder = (name: string) => {
    toast.success(`Folder "${name}" created in ${currentPath || 'root'}!`);
  };

  const handleUpload = () => {
    toast.info('Upload functionality will be available with backend integration.');
  };

  const handleRefresh = () => {
    toast.success('Refreshed!');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <BucketSidebar
        buckets={buckets}
        selectedBucket={selectedBucket}
        onSelectBucket={handleSelectBucket}
        onCreateBucket={() => setShowCreateBucket(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {selectedBucket ? (
          <>
            <BucketHeader
              bucket={selectedBucket}
              breadcrumbs={breadcrumbs}
              onNavigate={handleNavigate}
              onRefresh={handleRefresh}
              onUpload={handleUpload}
              onCreateFolder={() => setShowCreateFolder(true)}
            />
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <FileTable
                items={filteredItems}
                onItemClick={handleItemClick}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </div>
          </>
        ) : (
          <EmptyState onCreateBucket={() => setShowCreateBucket(true)} />
        )}
      </main>

      <CreateBucketDialog
        open={showCreateBucket}
        onOpenChange={setShowCreateBucket}
        onSubmit={handleCreateBucket}
      />

      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onSubmit={handleCreateFolder}
        currentPath={selectedBucket?.name ? `${selectedBucket.name}/${currentPath}` : ''}
      />
    </div>
  );
};

export default Index;
