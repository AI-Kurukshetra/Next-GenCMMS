-- Extended migration to add missing tables and columns for full CMMS functionality

-- Alter existing tables to add missing columns
alter table assets add column if not exists purchase_date date;
alter table assets add column if not exists warranty_expiry date;
alter table assets add column if not exists specifications jsonb default '{}'::jsonb;

alter table work_orders add column if not exists started_at timestamptz;
alter table work_orders add column if not exists completed_at timestamptz;
alter table work_orders add column if not exists closure_notes text;

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists updated_at timestamptz default now();

-- Create vendors table
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  services text,
  contact_name text,
  email text,
  phone text,
  performance_score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table inventory_parts add column if not exists vendor_id uuid references vendors(id) on delete set null;

-- Create work_order_time_logs table
create table if not exists work_order_time_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  technician_id uuid not null references profiles(id) on delete cascade,
  minutes_spent integer not null check (minutes_spent > 0),
  labor_cost numeric(12,2),
  logged_at timestamptz not null default now()
);

-- Create work_order_parts table
create table if not exists work_order_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  part_id uuid not null references inventory_parts(id) on delete restrict,
  quantity_used numeric(12,2) not null check (quantity_used > 0),
  unit_cost numeric(12,2),
  created_at timestamptz not null default now()
);

-- Create maintenance_history table
create table if not exists maintenance_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  performed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Create documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  bucket text not null,
  path text not null,
  mime_type text,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Create audit_logs table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Enable RLS on new tables
alter table vendors enable row level security;
alter table work_order_time_logs enable row level security;
alter table work_order_parts enable row level security;
alter table maintenance_history enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;

-- RLS Policies for vendors
create policy "Vendors access own org" on vendors
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

-- RLS Policies for work_order_time_logs
create policy "Time logs access own org" on work_order_time_logs
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

-- RLS Policies for work_order_parts
create policy "WO parts access own org" on work_order_parts
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

-- RLS Policies for maintenance_history
create policy "Maintenance history access own org" on maintenance_history
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

-- RLS Policies for documents
create policy "Documents access own org" on documents
for all using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

-- RLS Policies for audit_logs
create policy "Audit logs access own org" on audit_logs
for select using (organization_id = public.current_org_id());

create policy "Audit logs insert own org" on audit_logs
for insert with check (organization_id = public.current_org_id());

-- Create indexes for performance
create index if not exists idx_vendors_org on vendors(organization_id);
create index if not exists idx_time_logs_wo on work_order_time_logs(work_order_id);
create index if not exists idx_time_logs_tech on work_order_time_logs(technician_id);
create index if not exists idx_wo_parts_wo on work_order_parts(work_order_id);
create index if not exists idx_wo_parts_part on work_order_parts(part_id);
create index if not exists idx_maint_history_asset on maintenance_history(asset_id);
create index if not exists idx_maint_history_wo on maintenance_history(work_order_id);
create index if not exists idx_documents_entity on documents(entity_type, entity_id);
create index if not exists idx_audit_logs_org_user on audit_logs(organization_id, user_id);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- Add unique index for serial_number
create unique index if not exists idx_assets_serial_unique on assets(organization_id, serial_number) where serial_number is not null;
