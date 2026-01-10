-- NUCLEAR OPTION: FIX ALL PROFILE PERMISSIONS

-- 1. STORAGE: Fix Avatars Bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop all existing storage policies to start fresh
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update their own avatar." on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;

-- Create extremely permissive policies for 'avatars' bucket
create policy "Public Select"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Auth Insert"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Auth Update"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 2. DATABASE: Fix Users Table Permissions
alter table public.users enable row level security;

-- Drop all existing user policies
drop policy if exists "Public profiles are viewable by everyone." on public.users;
drop policy if exists "Users can update own profile." on public.users;
drop policy if exists "Users can insert their own profile." on public.users;

-- Create Correct Policies
create policy "Enable read access for all users"
  on public.users for select
  using (true);

create policy "Enable insert for authenticated users only"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Enable update for users based on email"
  on public.users for update
  using (auth.uid() = id);

-- 3. SELF-REPAIR: Ensure the current user exists
-- This function checks if a public.users row exists for the auth user, and if not, creates it.
create or replace function public.ensure_user_exists()
returns void as $$
begin
  insert into public.users (id, username, avatar_url)
  select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
  from auth.users
  where id = auth.uid()
  on conflict (id) do nothing;
end;
$$ language plpgsql security definer;

-- Auto-run this function for any calling user (via RPC if needed, but the triggers should handle it)
-- We'll just rely on the actions.ts 'upsert' now that policies are fixed.
