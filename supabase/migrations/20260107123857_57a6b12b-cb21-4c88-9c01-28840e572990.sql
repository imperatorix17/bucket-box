-- Create buckets table
CREATE TABLE public.buckets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  access TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (access IN ('PRIVATE', 'PUBLIC')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage_items table (files and folders)
CREATE TABLE public.storage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID NOT NULL REFERENCES public.buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  path TEXT NOT NULL DEFAULT '',
  size BIGINT DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bucket_id, path, name)
);

-- Enable RLS but allow all operations (auth handled by app config)
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_items ENABLE ROW LEVEL SECURITY;

-- Public policies (auth is handled at app level via config)
CREATE POLICY "Allow all bucket operations" ON public.buckets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all storage_items operations" ON public.storage_items FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buckets_updated_at BEFORE UPDATE ON public.buckets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_storage_items_updated_at BEFORE UPDATE ON public.storage_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', true);

-- Storage policies
CREATE POLICY "Allow public read for user-files" ON storage.objects FOR SELECT USING (bucket_id = 'user-files');
CREATE POLICY "Allow insert for user-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-files');
CREATE POLICY "Allow update for user-files" ON storage.objects FOR UPDATE USING (bucket_id = 'user-files');
CREATE POLICY "Allow delete for user-files" ON storage.objects FOR DELETE USING (bucket_id = 'user-files');