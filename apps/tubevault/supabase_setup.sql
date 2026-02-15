-- Copy and paste this entire block into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mucfobyfjoynukuezfex/sql

-- 1. Create the 'categories' table
create table if not exists categories (
  id text primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the 'videos' table
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  title text not null,
  subtitle text,
  category_id text references categories(id),
  thumbnail text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Insert default categories (Safe to run multiple times)
insert into categories (id, name)
values
  ('all', 'ALL'),
  ('standup', 'STANDUP COMEDY'),
  ('dj', 'DJ SETS'),
  ('recipes', 'RECIPES'),
  ('conspiracy', 'CONSPIRACY THEORIES'),
  ('live', 'LIVE PERFORMANCES')
on conflict (id) do nothing;

-- 4. Enable Row Level Security (RLS) - Optional for now but good practice
alter table categories enable row level security;
alter table videos enable row level security;

-- 5. Create policies to allow public access (since no auth is implemented yet)
create policy "Public read access for categories"
on categories for select
to anon
using (true);

create policy "Public insert access for categories"
on categories for insert
to anon
with check (true);

create policy "Public read access for videos"
on videos for select
to anon
using (true);

create policy "Public insert access for videos"
on videos for insert
to anon
with check (true);

create policy "Public delete access for videos"
on videos for delete
to anon
using (true);
