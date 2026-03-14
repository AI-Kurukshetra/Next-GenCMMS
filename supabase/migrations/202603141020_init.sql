create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'maintenance_manager', 'technician');
create type asset_status as enum ('active', 'inactive', 'under_maintenance', 'retired');
create type work_order_status as enum ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
create type work_order_priority as enum ('low', 'medium', 'high', 'critical');
create type maintenance_type as enum ('preventive', 'corrective', 'inspection');

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role user_role not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid not null references locations(id) on delete restrict,
  parent_asset_id uuid references assets(id) on delete set null,
  name text not null,
  model text,
  serial_number text,
  manufacturer text,
  status asset_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid not null references locations(id) on delete restrict,
  asset_id uuid not null references assets(id) on delete restrict,
  title text not null,
  description text,
  status work_order_status not null default 'open',
  priority work_order_priority not null default 'medium',
  maintenance_type maintenance_type not null,
  assigned_to uuid references profiles(id),
  due_date date,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid not null references locations(id) on delete restrict,
  name text not null,
  sku text,
  quantity_on_hand numeric(12,2) not null default 0,
  reorder_threshold numeric(12,2) not null default 0,
  unit_cost numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists preventive_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  title text not null,
  interval_days integer not null check (interval_days > 0),
  next_due_date date not null,
  is_active boolean not null default true,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_org_status on assets(organization_id, status);
create index if not exists idx_work_orders_org_status on work_orders(organization_id, status);
create index if not exists idx_inventory_org on inventory_parts(organization_id);
create index if not exists idx_pm_org_due on preventive_schedules(organization_id, next_due_date);

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table locations enable row level security;
alter table assets enable row level security;
alter table work_orders enable row level security;
alter table inventory_parts enable row level security;
alter table preventive_schedules enable row level security;
alter table notifications enable row level security;

create policy "Profiles read own org" on profiles
for select using (organization_id = public.current_org_id());

create policy "Profiles insert own row" on profiles
for insert with check (id = auth.uid());

create policy "Profiles update own row" on profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Organizations read own" on organizations
for select using (id = public.current_org_id());

create policy "Organizations insert authenticated" on organizations
for insert with check (auth.uid() is not null);

create policy "Locations access own org" on locations
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "Assets access own org" on assets
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "Work orders access own org" on work_orders
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "Inventory access own org" on inventory_parts
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "PM schedules access own org" on preventive_schedules
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "Notifications access own user" on notifications
for select using (
  organization_id = public.current_org_id() and
  user_id = auth.uid()
);

create policy "Notifications insert own org" on notifications
for insert with check (organization_id = public.current_org_id());
