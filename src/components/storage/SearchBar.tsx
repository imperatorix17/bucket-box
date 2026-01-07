import { Search, HelpCircle, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <h2 className="text-lg font-medium">Object Browser</h2>
      
      <div className="flex items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Start typing to filter objects in the bucket"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Sun className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
