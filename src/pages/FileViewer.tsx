import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AccessDenied from './AccessDenied';
import { Loader2 } from 'lucide-react';

export default function FileViewer() {
  const { '*': filePath } = useParams();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!filePath) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const pathParts = filePath.split('/');
      const bucketName = pathParts[0];
      const itemPath = pathParts.slice(1).join('/');

      try {
        // Check if bucket exists and its access level
        const { data: bucket, error: bucketError } = await supabase
          .from('buckets')
          .select('access')
          .eq('name', bucketName)
          .single();

        if (bucketError || !bucket) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        // If bucket is private, deny access
        if (bucket.access === 'PRIVATE') {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        // Get file from storage
        const storagePath = `${bucketName}/${itemPath}`;
        const { data } = supabase.storage
          .from('user-files')
          .getPublicUrl(storagePath);

        if (data?.publicUrl) {
          setFileUrl(data.publicUrl);
          
          // Determine mime type from extension
          const ext = itemPath.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
          };
          setMimeType(mimeTypes[ext || ''] || 'application/octet-stream');
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Error checking file access:', error);
        setAccessDenied(true);
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [filePath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDenied />;
  }

  if (!fileUrl) {
    return <AccessDenied />;
  }

  // Render based on mime type
  if (mimeType?.startsWith('image/')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <img src={fileUrl} alt={filePath} className="max-w-full max-h-screen object-contain" />
      </div>
    );
  }

  // For other files, redirect to download
  window.location.href = fileUrl;
  return null;
}
