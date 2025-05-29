-- Table for user profiles
create table if not exists user_profiles (
  id uuid primary key,
  full_name text,
  email text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table for watchlist items
create table if not exists watchlist (
  id serial primary key,
  user_id uuid references user_profiles(id) on delete cascade,
  movie_id int not null,
  title text not null,
  type text check (type in ('movie', 'tv')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table for favorite items
create table if not exists favorites (
  id serial primary key,
  user_id uuid references user_profiles(id) on delete cascade,
  movie_id int not null,
  title text not null,
  type text check (type in ('movie', 'tv')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for performance
create index if not exists idx_watchlist_user_id on watchlist(user_id);
create index if not exists idx_favorites_user_id on favorites(user_id);
