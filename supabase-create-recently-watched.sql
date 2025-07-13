-- Create recently_watched table to track recently watched movies and TV shows
create table if not exists recently_watched (
  id serial primary key,
  user_id uuid references user_profiles(id) on delete cascade,
  item_id int not null,
  type text check (type in ('movie', 'tv')) not null,
  watched_at timestamp with time zone default now()
);

-- Index for performance on user_id and watched_at
create index if not exists idx_recently_watched_user_id on recently_watched(user_id);
create index if not exists idx_recently_watched_watched_at on recently_watched(watched_at);

-- Enable row level security
alter table recently_watched enable row level security;

-- Policies for authenticated users
create policy "Allow authenticated users to select own recently watched" on recently_watched
  for select using (user_id = auth.uid());

create policy "Allow authenticated users to insert own recently watched" on recently_watched
  for insert with check (user_id = auth.uid());

create policy "Allow authenticated users to delete own recently watched" on recently_watched
  for delete using (user_id = auth.uid());

create policy "Allow authenticated users to update own recently watched" on recently_watched
  for update using (user_id = auth.uid());
