-- Minimal RLS policy to allow all authenticated users to insert, select, update, and delete in the avatars bucket

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON storage.objects
FOR INSERT
TO authenticated
USING (true);

-- Allow all authenticated users to select
CREATE POLICY "Allow authenticated select" ON storage.objects
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to update
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE
TO authenticated
USING (true);

-- Allow all authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE
TO authenticated
USING (true);
