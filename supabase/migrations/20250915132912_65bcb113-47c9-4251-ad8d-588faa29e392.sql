-- Create public avatars bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies for avatars bucket
-- Public read access
create policy if not exists "Public read for avatars"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar into a folder with their user id
create policy if not exists "Authenticated users can upload their own avatar"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can update their own avatar files
create policy if not exists "Authenticated users can update their own avatar"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete their own avatar files
create policy if not exists "Authenticated users can delete their own avatar"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );