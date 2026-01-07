import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CreateBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, access: 'PRIVATE' | 'PUBLIC') => void;
}

export function CreateBucketDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateBucketDialogProps) {
  const [name, setName] = useState('');
  const [access, setAccess] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim().toLowerCase().replace(/\s+/g, '-'), access);
      setName('');
      setAccess('PRIVATE');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Bucket</DialogTitle>
          <DialogDescription>
            Buckets are containers for storing objects (files and folders).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bucket-name">Bucket Name</Label>
              <Input
                id="bucket-name"
                placeholder="my-bucket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Access Level</Label>
              <RadioGroup value={access} onValueChange={(v) => setAccess(v as 'PRIVATE' | 'PUBLIC')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    Private - Only authorized users can access
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PUBLIC" id="public" />
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    Public - Anyone with the link can access
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Bucket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
