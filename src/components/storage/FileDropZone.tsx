import { useState, useCallback, useEffect, ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function FileDropZone({ onFilesDropped, children, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && e.dataTransfer?.types.includes('Files')) {
        setDragCounter(prev => prev + 1);
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setIsDragging(false);
          return 0;
        }
        return newCount;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      if (disabled) return;

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        onFilesDropped(files);
      }
    };

    // Attach to window for full page drop support
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [disabled, onFilesDropped]);

  return (
    <>
      {children}
      
      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center z-[100] backdrop-blur-sm pointer-events-none">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="text-xl font-medium text-foreground">Drop files anywhere</p>
              <p className="text-sm text-muted-foreground">
                {disabled ? 'Select a bucket first' : 'Files will be uploaded to the current folder'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
