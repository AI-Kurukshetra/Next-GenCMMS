-- Fix RLS recursion causing "stack depth limit exceeded" during onboarding/workspace setup.

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

grant execute on function public.current_org_id() to anon, authenticated, service_role;

drop policy if exists "Profiles read own org" on public.profiles;
create policy "Profiles read own org" on public.profiles
for select using (
  id = auth.uid() or organization_id = public.current_org_id()
);

-- Keep self-update rule explicit
DROP POLICY IF EXISTS "Profiles update own row" ON public.profiles;
create policy "Profiles update own row" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
