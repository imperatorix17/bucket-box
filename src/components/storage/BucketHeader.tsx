import { ChevronLeft, Upload, FolderPlus, Database } from 'lucide-react';
import { Bucket, BreadcrumbItem } from '@/types/storage';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';

interface BucketHeaderProps {
  bucket: Bucket;
  breadcrumbs: BreadcrumbItem[];
  onBreadcrumbClick: (path: string) => void;
  onUpload: () => void;
  onCreateFolder: () => void;
}

export function BucketHeader({
  bucket,
  breadcrumbs,
  onBreadcrumbClick,
  onUpload,
  onCreateFolder,
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
