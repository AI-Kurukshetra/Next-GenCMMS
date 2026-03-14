-- Add missing columns to existing tables
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'info';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address text;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  po_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  order_date date NOT NULL,
  expected_date date,
  total_amount numeric(12, 2),
  notes text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_purchase_orders_org_status ON purchase_orders(organization_id, status);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);

-- RLS for purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_orders_org_read ON purchase_orders FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY purchase_orders_org_write ON purchase_orders FOR INSERT WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY purchase_orders_org_update ON purchase_orders FOR UPDATE USING (organization_id = public.current_org_id());
CREATE POLICY purchase_orders_org_delete ON purchase_orders FOR DELETE USING (organization_id = public.current_org_id());

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_part_id uuid NOT NULL REFERENCES inventory_parts(id) ON DELETE RESTRICT,
  quantity_ordered numeric(12, 2) NOT NULL CHECK (quantity_ordered > 0),
  unit_cost numeric(12, 2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);

-- RLS for purchase_order_items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_items_org_read ON purchase_order_items FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY po_items_org_write ON purchase_order_items FOR INSERT WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY po_items_org_update ON purchase_order_items FOR UPDATE USING (organization_id = public.current_org_id());
CREATE POLICY po_items_org_delete ON purchase_order_items FOR DELETE USING (organization_id = public.current_org_id());

-- Equipment Meters
CREATE TABLE IF NOT EXISTS equipment_meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  meter_type text NOT NULL CHECK (meter_type IN ('hours', 'cycles', 'distance', 'count')),
  unit text NOT NULL,
  current_reading numeric(12, 2),
  last_recorded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_equipment_meters_asset ON equipment_meters(asset_id);

-- RLS for equipment_meters
ALTER TABLE equipment_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipment_meters_org_read ON equipment_meters FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY equipment_meters_org_write ON equipment_meters FOR INSERT WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY equipment_meters_org_update ON equipment_meters FOR UPDATE USING (organization_id = public.current_org_id());
CREATE POLICY equipment_meters_org_delete ON equipment_meters FOR DELETE USING (organization_id = public.current_org_id());

-- Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  inspection_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'overdue')),
  due_date date NOT NULL,
  completed_date date,
  inspector_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_compliance_asset ON compliance_records(asset_id);
CREATE INDEX idx_compliance_status ON compliance_records(organization_id, status);

-- RLS for compliance_records
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY compliance_records_org_read ON compliance_records FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY compliance_records_org_write ON compliance_records FOR INSERT WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY compliance_records_org_update ON compliance_records FOR UPDATE USING (organization_id = public.current_org_id());
CREATE POLICY compliance_records_org_delete ON compliance_records FOR DELETE USING (organization_id = public.current_org_id());

-- Asset QR Codes
CREATE TABLE IF NOT EXISTS asset_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL UNIQUE REFERENCES assets(id) ON DELETE CASCADE,
  qr_token text NOT NULL UNIQUE,
  generated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_asset_qr_token ON asset_qr_codes(qr_token);

-- RLS for asset_qr_codes
ALTER TABLE asset_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_qr_org_read ON asset_qr_codes FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY asset_qr_org_write ON asset_qr_codes FOR INSERT WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY asset_qr_org_delete ON asset_qr_codes FOR DELETE USING (organization_id = public.current_org_id());
