-- Configure Supabase Storage bucket + RLS for asset/work-order documents.
-- Path convention enforced by policy:
--   org/{organization_id}/{entity}/{entity_id}/{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Documents bucket read own org" on storage.objects;
create policy "Documents bucket read own org"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = 'org'
  and split_part(name, '/', 2) = public.current_org_id()::text
);

drop policy if exists "Documents bucket write own org" on storage.objects;
create policy "Documents bucket write own org"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = 'org'
  and split_part(name, '/', 2) = public.current_org_id()::text
);

drop policy if exists "Documents bucket update own org" on storage.objects;
create policy "Documents bucket update own org"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = 'org'
  and split_part(name, '/', 2) = public.current_org_id()::text
)
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = 'org'
  and split_part(name, '/', 2) = public.current_org_id()::text
);

drop policy if exists "Documents bucket delete own org" on storage.objects;
create policy "Documents bucket delete own org"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 1) = 'org'
  and split_part(name, '/', 2) = public.current_org_id()::text
);
