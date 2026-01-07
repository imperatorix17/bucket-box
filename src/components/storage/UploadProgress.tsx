import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function UploadProgress({ uploads, onDismiss, onDismissAll }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const hasErrors = uploads.some(u => u.status === 'error');

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <span className="text-sm font-medium text-foreground">
          Uploading {completedCount}/{uploads.length} files
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismissAll}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {uploads.map((upload) => (
          <div key={upload.id} className="p-3 border-b border-border last:border-b-0">
            <div className="flex items-center gap-2">
              {upload.status === 'uploading' && (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              )}
              {upload.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              )}
              {upload.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              
              <span className="text-sm text-foreground truncate flex-1">
                {upload.name}
              </span>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 shrink-0" 
                onClick={() => onDismiss(upload.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {upload.status === 'uploading' && (
              <Progress value={upload.progress} className="h-1 mt-2" />
            )}
            
            {upload.status === 'error' && upload.error && (
              <p className="text-xs text-destructive mt-1">{upload.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
