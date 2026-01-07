import { ChevronLeft, Upload, FolderPlus, Database, Trash2, CheckSquare } from 'lucide-react';
import { Bucket, BreadcrumbItem } from '@/types/storage';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BucketHeaderProps {
  bucket: Bucket;
  breadcrumbs: BreadcrumbItem[];
  onBreadcrumbClick: (path: string) => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BucketHeader({
  bucket,
  breadcrumbs,
  onBreadcrumbClick,
  onUpload,
  onCreateFolder,
  selectedCount,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
}: BucketHeaderProps) {
  const canGoBack = breadcrumbs.length > 1;

  return (
    <div className="p-4 border-b border-border space-y-4">
      {/* Bucket Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-destructive" />
          <div>
            <h1 className="text-xl font-semibold">{bucket.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Created on: {formatDate(bucket.createdAt)}</span>
              <span>Access: {bucket.access}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Bulk actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDeleteSelected} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeselectAll}>
                  Deselect all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSelectAll}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Select all
            </Button>
          )}
          <Button size="sm" onClick={onUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canGoBack}
          onClick={() => {
            const previousPath = breadcrumbs[breadcrumbs.length - 2]?.path || '';
            onBreadcrumbClick(previousPath);
          }}
          className="shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 flex items-center bg-card rounded-md border border-border px-3 py-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center">
              {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
              <button
                onClick={() => onBreadcrumbClick(crumb.path)}
                className="text-sm hover:text-primary transition-colors"
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCreateFolder}
          className="shrink-0"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New folder
        </Button>
      </div>
    </div>
  );
}
