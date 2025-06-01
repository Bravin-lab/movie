-- Fix RLS policy for avatars upload to allow authenticated users to insert files with owner null or matching auth.uid()

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON storage.objects;

CREATE POLICY "Allow authenticated users to insert" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner OR owner IS NULL);
