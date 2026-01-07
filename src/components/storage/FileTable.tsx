import { useState } from 'react';
import { Folder, File, ChevronUp, ChevronDown } from 'lucide-react';
import { StorageItem } from '@/types/storage';
import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface FileTableProps {
  items: StorageItem[];
  onItemClick: (item: StorageItem) => void;
  selectedItems: string[];
  onSelectionChange: (ids: string[]) => void;
}

type SortField = 'name' | 'lastModified' | 'size';
type SortDirection = 'asc' | 'desc';

export function FileTable({
  items,
  onItemClick,
  selectedItems,
  onSelectionChange,
}: FileTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    // Folders always come first
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'lastModified':
        comparison = a.lastModified.getTime() - b.lastModified.getTime();
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter((i) => i !== id));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Folder className="w-16 h-16 mb-4 opacity-30" />
        <p>This bucket is empty</p>
        <p className="text-sm">Upload files or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="p-3 w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
            </th>
            <th
              className="p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('name')}
            >
              <span className="flex items-center">
                Name
                <SortIcon field="name" />
              </span>
            </th>
            <th
              className="p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('lastModified')}
            >
              <span className="flex items-center">
                Last Modified
                <SortIcon field="lastModified" />
              </span>
            </th>
            <th
              className="p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right"
              onClick={() => handleSort('size')}
            >
              <span className="flex items-center justify-end">
                Size
                <SortIcon field="size" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className={cn(
                'border-b border-border/50 hover:bg-card/50 transition-colors cursor-pointer animate-fade-in',
                selectedItems.includes(item.id) && 'bg-primary/5'
              )}
            >
              <td className="p-3">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) =>
                    handleSelectItem(item.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td
                className="p-3"
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-center gap-3">
                  {item.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-warning" />
                  ) : (
                    <File className="w-5 h-5 text-success" />
                  )}
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {formatDate(item.lastModified)}
              </td>
              <td className="p-3 text-sm text-muted-foreground text-right">
                {item.type === 'file' ? formatFileSize(item.size) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
