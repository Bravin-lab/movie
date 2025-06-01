-- Enable row level security on watchlist and favorites tables
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own watchlist items
CREATE POLICY "Allow authenticated users to select own watchlist" ON public.watchlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert watchlist items
CREATE POLICY "Allow authenticated users to insert watchlist" ON public.watchlist
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own watchlist items
CREATE POLICY "Allow authenticated users to update own watchlist" ON public.watchlist
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own watchlist items
CREATE POLICY "Allow authenticated users to delete own watchlist" ON public.watchlist
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to select their own favorite items
CREATE POLICY "Allow authenticated users to select own favorites" ON public.favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert favorite items
CREATE POLICY "Allow authenticated users to insert favorites" ON public.favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own favorite items
CREATE POLICY "Allow authenticated users to update own favorites" ON public.favorites
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own favorite items
CREATE POLICY "Allow authenticated users to delete own favorites" ON public.favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
