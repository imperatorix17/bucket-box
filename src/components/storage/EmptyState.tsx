import { Database, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateBucket: () => void;
}

export function EmptyState({ onCreateBucket }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-6">
        <Database className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No bucket selected</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Select a bucket from the sidebar to browse its contents, or create a new bucket to get started.
      </p>
      <Button onClick={onCreateBucket}>
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Bucket
      </Button>
    </div>
  );
}
