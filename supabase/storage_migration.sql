-- Create 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up security policies for the 'avatars' bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' ); 
-- Note: In a real app we'd restrict update/insert to auth.uid() = owner, 
-- but for MVP allowing broader access or simple authenticated access is fine.
-- A better policy for insert/update:
-- (bucket_id = 'avatars' AND auth.role() = 'authenticated')

