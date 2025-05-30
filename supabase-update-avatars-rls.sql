-- Enable row level security on the avatars bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert (upload) files
CREATE POLICY "Allow authenticated users to insert" ON storage.objects
FOR INSERT
TO authenticated
USING (auth.uid() = owner);

-- Allow authenticated users to select (read) files
CREATE POLICY "Allow authenticated users to select" ON storage.objects
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update files they own
CREATE POLICY "Allow authenticated users to update own files" ON storage.objects
FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

-- Allow authenticated users to delete files they own
CREATE POLICY "Allow authenticated users to delete own files" ON storage.objects
FOR DELETE
TO authenticated
USING (auth.uid() = owner);
