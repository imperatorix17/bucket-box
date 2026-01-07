import { useState, useEffect } from 'react';
import { X, Copy, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface CodePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  fileName: string;
  mimeType?: string;
}

// List of text-based file extensions
const TEXT_EXTENSIONS = [
  'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
  'go', 'rs', 'swift', 'kt', 'kts', 'scala',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'env', 'gitignore', 'dockerignore', 'editorconfig',
  'toml', 'ini', 'cfg', 'conf', 'config',
  'csv', 'tsv', 'log',
  'vue', 'svelte', 'astro',
  'r', 'lua', 'perl', 'pl',
];

export function isTextFile(fileName: string, mimeType?: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (TEXT_EXTENSIONS.includes(ext)) return true;
  if (mimeType?.startsWith('text/')) return true;
  if (mimeType?.includes('json') || mimeType?.includes('xml') || mimeType?.includes('javascript')) return true;
  return false;
}

export function CodePreviewDialog({ open, onClose, url, fileName, mimeType }: CodePreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && url) {
      setLoading(true);
      setError(null);
      setContent(null);

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch file');
          return res.text();
        })
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching file:', err);
          setError('Unable to load file content');
          setLoading(false);
        });
    }
  }, [open, url]);

  if (!open) return null;

  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Get language class for basic syntax highlighting hint
  const getLanguageLabel = () => {
    const langMap: Record<string, string> = {
      js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX',
      py: 'Python', rb: 'Ruby', php: 'PHP', java: 'Java',
      c: 'C', cpp: 'C++', h: 'C Header', hpp: 'C++ Header',
      go: 'Go', rs: 'Rust', swift: 'Swift', kt: 'Kotlin',
      html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS',
      json: 'JSON', xml: 'XML', yaml: 'YAML', yml: 'YAML',
      md: 'Markdown', txt: 'Plain Text', sql: 'SQL',
      sh: 'Shell', bash: 'Bash', ps1: 'PowerShell',
      vue: 'Vue', svelte: 'Svelte', astro: 'Astro',
    };
    return langMap[ext] || ext.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm truncate max-w-md">{fileName}</span>
            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
              {getLanguageLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words bg-muted/30 min-h-full">
                <code>{content}</code>
              </pre>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        {content && (
          <div className="p-2 border-t text-xs text-muted-foreground text-center shrink-0">
            {content.split('\n').length} lines • {new Blob([content]).size} bytes
          </div>
        )}
      </div>
    </div>
  );
}
