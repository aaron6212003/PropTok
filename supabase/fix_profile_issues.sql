-- 1. Ensure 'avatars' bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Reset Storage Policies (Drop first to avoid conflicts)
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update their own avatar." on storage.objects;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );

-- 3. Fix Public Users Update Policy
drop policy if exists "Users can update own profile." on public.users;

create policy "Users can update own profile."
  on public.users
  for update
  using ( auth.uid() = id );
  
-- 4. Fix Public Users Insert Policy (Implicitly handled by trigger usually, but good to have)
create policy "Users can insert their own profile."
  on public.users
  for insert
  with check ( auth.uid() = id );
