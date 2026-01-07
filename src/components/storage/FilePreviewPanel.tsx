import { useState } from 'react';
import { X, Download, Trash2, Link2, Eye, Folder, File, Image, FileText, FileVideo, FileAudio } from 'lucide-react';
import { StorageItem, Bucket } from '@/types/storage';
import { Button } from '@/components/ui/button';
import { formatFileSize, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { getFileUrl } from '@/services/api';

interface FilePreviewPanelProps {
  item: StorageItem | null;
  bucket: Bucket | null;
  onClose: () => void;
  onDelete: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getFileIcon(mimeType?: string) {
  if (!mimeType) return <File className="w-12 h-12 text-muted-foreground" />;
  
  if (mimeType.startsWith('image/')) {
    return <Image className="w-12 h-12 text-success" />;
  } else if (mimeType.startsWith('video/')) {
    return <FileVideo className="w-12 h-12 text-primary" />;
  } else if (mimeType.startsWith('audio/')) {
    return <FileAudio className="w-12 h-12 text-warning" />;
  } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
    return <FileText className="w-12 h-12 text-destructive" />;
  }
  return <File className="w-12 h-12 text-muted-foreground" />;
}

function isImageFile(mimeType?: string): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

export function FilePreviewPanel({ item, bucket, onClose, onDelete }: FilePreviewPanelProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!item || !bucket) return null;

  // Build file URL for the local API
  const filePath = item.path ? `${item.path}/${item.name}` : item.name;
  const publicUrl = item.type === 'file' ? getFileUrl(bucket.name, filePath) : null;

  const handleCopyUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success('URL copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  const handlePreviewOpen = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <>
      <div className="w-80 border-l border-border bg-card flex flex-col h-full animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-medium text-sm truncate flex-1">{item.name}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {/* Preview */}
          <div className="p-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {item.type === 'folder' ? (
                <Folder className="w-16 h-16 text-warning" />
              ) : isImageFile(item.mimeType) && publicUrl ? (
                <img
                  src={publicUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                getFileIcon(item.mimeType)
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Actions:</p>
            {item.type === 'file' && (
              <>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                {publicUrl && bucket.access === 'PUBLIC' && (
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleCopyUrl}>
                    <Link2 className="w-4 h-4" />
                    Copy URL
                  </Button>
                )}
                {isImageFile(item.mimeType) && publicUrl && (
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={handlePreviewOpen}>
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                )}
              </>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

          {/* Object Info */}
          <div className="p-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Object Info</p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name:</p>
                <p className="text-sm font-medium break-all">{item.name}</p>
              </div>

              {item.type === 'file' && item.size !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Size:</p>
                  <p className="text-sm">{formatFileSize(item.size)}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Type:</p>
                <p className="text-sm">{item.type === 'folder' ? 'Folder' : (item.mimeType || 'Unknown')}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Last Modified:</p>
                <p className="text-sm">{formatDate(item.lastModified)}</p>
              </div>

              {publicUrl && item.type === 'file' && bucket.access === 'PUBLIC' && (
                <div>
                  <p className="text-xs text-muted-foreground">Public URL:</p>
                  <p className="text-xs text-primary break-all cursor-pointer hover:underline" onClick={handleCopyUrl}>
                    {publicUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete "${item.name}"?`}
        description={`Are you sure you want to delete this ${item.type}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
