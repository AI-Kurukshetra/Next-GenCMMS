# Database Schema - Supabase PostgreSQL

## 1. Design Rules
- Multi-tenant by `organization_id` across all domain tables.
- Use UUID primary keys.
- Use `created_at`, `updated_at` timestamps on mutable tables.
- Enforce core integrity with foreign keys and constrained enums.
- Enable RLS on all tenant tables.

## 2. Core Enums
- `user_role`: `admin`, `maintenance_manager`, `technician`
- `asset_status`: `active`, `inactive`, `under_maintenance`, `retired`
- `work_order_status`: `open`, `assigned`, `in_progress`, `completed`, `cancelled`
- `work_order_priority`: `low`, `medium`, `high`, `critical`
- `maintenance_type`: `preventive`, `corrective`, `inspection`

## 3. Table Blueprint

### organizations
- `id uuid pk`
- `name text not null`
- `created_at timestamptz not null default now()`

### profiles
- `id uuid pk` (references `auth.users.id`)
- `organization_id uuid not null fk organizations(id)`
- `role user_role not null`
- `full_name text`
- `phone text`
- `created_at timestamptz not null default now()`

### locations
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `name text not null`
- `code text`
- `address text`
- `created_at timestamptz not null default now()`

### assets
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `location_id uuid not null fk locations(id)`
- `parent_asset_id uuid null fk assets(id)`
- `name text not null`
- `model text`
- `serial_number text`
- `manufacturer text`
- `purchase_date date`
- `warranty_expiry date`
- `status asset_status not null default 'active'`
- `specifications jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### work_orders
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `location_id uuid not null fk locations(id)`
- `asset_id uuid not null fk assets(id)`
- `title text not null`
- `description text`
- `status work_order_status not null default 'open'`
- `priority work_order_priority not null default 'medium'`
- `maintenance_type maintenance_type not null`
- `assigned_to uuid null fk profiles(id)`
- `due_date date`
- `started_at timestamptz`
- `completed_at timestamptz`
- `closure_notes text`
- `created_by uuid not null fk profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### work_order_time_logs
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `work_order_id uuid not null fk work_orders(id)`
- `technician_id uuid not null fk profiles(id)`
- `minutes_spent integer not null check (minutes_spent > 0)`
- `labor_cost numeric(12,2)`
- `logged_at timestamptz not null default now()`

### inventory_parts
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `location_id uuid not null fk locations(id)`
- `name text not null`
- `sku text`
- `quantity_on_hand numeric(12,2) not null default 0`
- `reorder_threshold numeric(12,2) not null default 0`
- `unit_cost numeric(12,2)`
- `vendor_id uuid null fk vendors(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### work_order_parts
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `work_order_id uuid not null fk work_orders(id)`
- `part_id uuid not null fk inventory_parts(id)`
- `quantity_used numeric(12,2) not null check (quantity_used > 0)`
- `unit_cost numeric(12,2)`
- `created_at timestamptz not null default now()`

### vendors
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `name text not null`
- `services text`
- `contact_name text`
- `email text`
- `phone text`
- `performance_score numeric(5,2)`
- `created_at timestamptz not null default now()`

### preventive_schedules
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `asset_id uuid not null fk assets(id)`
- `title text not null`
- `interval_days integer not null check (interval_days > 0)`
- `next_due_date date not null`
- `is_active boolean not null default true`
- `created_by uuid not null fk profiles(id)`
- `created_at timestamptz not null default now()`

### maintenance_history
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `asset_id uuid not null fk assets(id)`
- `work_order_id uuid null fk work_orders(id)`
- `event_type text not null`
- `event_data jsonb not null default '{}'::jsonb`
- `performed_by uuid fk profiles(id)`
- `created_at timestamptz not null default now()`

### documents
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `bucket text not null`
- `path text not null`
- `mime_type text`
- `uploaded_by uuid not null fk profiles(id)`
- `created_at timestamptz not null default now()`

### notifications
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `user_id uuid not null fk profiles(id)`
- `type text not null`
- `title text not null`
- `body text`
- `is_read boolean not null default false`
- `created_at timestamptz not null default now()`

### equipment_meters
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `asset_id uuid not null fk assets(id)`
- `meter_type text not null` (e.g., `runtime_hours`, `production_count`)
- `current_reading numeric(14,2) not null`
- `unit text not null` (e.g., `hours`, `cycles`)
- `last_recorded_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### sensor_readings
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `asset_id uuid not null fk assets(id)`
- `sensor_type text not null` (e.g., `temperature`, `vibration`, `pressure`)
- `reading_value numeric(12,4) not null`
- `unit text`
- `status text` (e.g., `normal`, `warning`, `critical`)
- `recorded_at timestamptz not null`
- `created_at timestamptz not null default now()`

### purchase_orders
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `vendor_id uuid not null fk vendors(id)`
- `po_number text not null unique`
- `status text not null default 'pending'` (e.g., `pending`, `approved`, `shipped`, `received`, `cancelled`)
- `total_amount numeric(12,2)`
- `order_date date not null`
- `expected_delivery_date date`
- `actual_delivery_date date`
- `created_by uuid not null fk profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### purchase_order_items
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `purchase_order_id uuid not null fk purchase_orders(id)`
- `part_id uuid not null fk inventory_parts(id)`
- `quantity_ordered numeric(12,2) not null check (quantity_ordered > 0)`
- `unit_price numeric(12,2) not null`
- `quantity_received numeric(12,2) not null default 0`
- `created_at timestamptz not null default now()`

### compliance_records
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `asset_id uuid null fk assets(id)`
- `location_id uuid null fk locations(id)`
- `inspection_type text not null` (e.g., `safety`, `regulatory`, `environmental`)
- `status text not null` (e.g., `compliant`, `non_compliant`, `pending_action`)
- `due_date date`
- `inspection_date date`
- `notes text`
- `inspector_id uuid fk profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### audit_logs
- `id uuid pk`
- `organization_id uuid not null fk organizations(id)`
- `user_id uuid not null fk profiles(id)`
- `entity_type text not null` (e.g., `asset`, `work_order`, `inventory_part`, `user`)
- `entity_id uuid not null`
- `action text not null` (e.g., `create`, `update`, `delete`, `status_change`)
- `changes jsonb` (before/after values)
- `ip_address text`
- `created_at timestamptz not null default now()`

## 4. Indexing Strategy
- `assets (organization_id, location_id, status)`
- `assets (organization_id, serial_number)` unique where serial not null
- `work_orders (organization_id, status, priority, due_date)`
- `work_orders (organization_id, assigned_to, status)`
- `inventory_parts (organization_id, location_id, quantity_on_hand)`
- `preventive_schedules (organization_id, next_due_date, is_active)`
- `maintenance_history (organization_id, asset_id, created_at desc)`
- `equipment_meters (organization_id, asset_id, meter_type)`
- `sensor_readings (organization_id, asset_id, recorded_at desc)`
- `purchase_orders (organization_id, status, order_date desc)`
- `purchase_orders (organization_id, po_number)` unique
- `compliance_records (organization_id, asset_id, inspection_type)`
- `compliance_records (organization_id, location_id, due_date)`
- `audit_logs (organization_id, entity_type, entity_id, created_at desc)`
- `audit_logs (organization_id, user_id, created_at desc)`

## 5. RLS Policy Matrix (High-Level)
- Admin:
  - Full CRUD within own `organization_id`.
- Maintenance Manager:
  - CRUD for assets, work orders, schedules, inventory, vendors within own org.
- Technician:
  - Read assets in own org.
  - Read/update only assigned work orders.
  - Insert own time logs, notes, media records.
  - Read inventory; no direct part master edits.

RLS baseline policy pattern:
- `organization_id = (select organization_id from profiles where id = auth.uid())`

## 6. Migration and Seed Guidance
- Create enums first, then tables, then foreign keys and indexes, then RLS policies.
- Add deterministic seed data:
  - 1 org
  - 2 locations
  - 3 users (admin/manager/technician)
  - 10 assets
  - 20 work orders
  - 25 parts
- Include rollback plan per migration.
