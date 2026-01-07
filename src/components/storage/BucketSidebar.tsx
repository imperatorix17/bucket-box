import { useState } from 'react';
import { Plus, Search, Database, FileText, LogOut, HardDrive, Trash2 } from 'lucide-react';
import { Bucket } from '@/types/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BucketSidebarProps {
  buckets: Bucket[];
  selectedBucket: Bucket | null;
  onSelectBucket: (bucket: Bucket) => void;
  onCreateBucket: () => void;
  onDeleteBucket: (bucket: Bucket) => void;
}

export function BucketSidebar({
  buckets,
  selectedBucket,
  onSelectBucket,
  onCreateBucket,
  onDeleteBucket,
}: BucketSidebarProps) {
  const [filter, setFilter] = useState('');

  const filteredBuckets = buckets.filter((bucket) =>
    bucket.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-1">
          <HardDrive className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-sidebar-foreground">CloudVault</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
          Storage
        </span>
      </div>

      {/* Create Bucket Button */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onCreateBucket}
        >
          <Plus className="w-4 h-4" />
          Create Bucket
        </Button>
      </div>

      {/* Filter */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter Buckets"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Buckets Label */}
      <div className="px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Buckets
        </span>
      </div>

      {/* Bucket List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
        {filteredBuckets.map((bucket) => (
          <div
            key={bucket.id}
            className={cn(
              'group w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors cursor-pointer',
              'hover:bg-sidebar-accent',
              selectedBucket?.id === bucket.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground'
            )}
            onClick={() => onSelectBucket(bucket)}
          >
            <Database className="w-4 h-4 text-destructive shrink-0" />
            <span className="truncate text-sm flex-1">{bucket.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBucket(bucket);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent text-sm"
        >
          <FileText className="w-4 h-4" />
          Documentation
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
