"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createPurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const vendor_id = String(formData.get("vendor_id") ?? "").trim();
  const po_number = String(formData.get("po_number") ?? "").trim();
  const order_date = String(formData.get("order_date") ?? "").trim();
  const expected_date = String(formData.get("expected_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!vendor_id || !po_number || !order_date) {
    throw new Error("Vendor, PO number, and order date are required");
  }

  const { error } = await supabase.from("purchase_orders").insert({
    organization_id: profile.organization_id,
    vendor_id,
    po_number,
    order_date,
    expected_date: expected_date || null,
    notes: notes || null,
    status: "draft",
    created_by: profile.id,
  });

  if (error) {
    throw new Error(`Failed to create PO: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
}

export async function addPurchaseOrderItemAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const purchase_order_id = formData.get("purchase_order_id") as string;
  const inventory_part_id = formData.get("inventory_part_id") as string;
  const quantity_ordered = formData.get("quantity_ordered") as string;
  const unit_cost = formData.get("unit_cost") as string;

  if (!purchase_order_id || !inventory_part_id || !quantity_ordered) {
    throw new Error("PO, part, and quantity are required");
  }
  const quantity = Number(quantity_ordered);
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }
  const parsedUnitCost = unit_cost ? Number(unit_cost) : null;
  if (parsedUnitCost !== null && (Number.isNaN(parsedUnitCost) || parsedUnitCost < 0)) {
    throw new Error("Unit cost must be 0 or greater.");
  }

  const { error } = await supabase.from("purchase_order_items").insert({
    organization_id: profile.organization_id,
    purchase_order_id,
    inventory_part_id,
    quantity_ordered: quantity,
    unit_cost: parsedUnitCost,
  });

  if (error) {
    throw new Error(`Failed to add PO item: ${error.message}`);
  }

  revalidatePath(`/dashboard/purchase-orders/${purchase_order_id}`);
}

export async function updatePurchaseOrderStatusAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["draft", "sent", "received", "cancelled"]);
  if (!id || !status || !allowedStatuses.has(status)) {
    throw new Error("Valid purchase order ID and status are required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update PO status: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
  revalidatePath(`/dashboard/purchase-orders/${id}`);
}

export async function updatePurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const vendor_id = String(formData.get("vendor_id") ?? "").trim();
  const po_number = String(formData.get("po_number") ?? "").trim();
  const order_date = String(formData.get("order_date") ?? "").trim();
  const expected_date = String(formData.get("expected_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["draft", "sent", "received", "cancelled"]);

  if (!id || !vendor_id || !po_number || !order_date || !allowedStatuses.has(status)) {
    throw new Error("Valid PO ID, vendor, PO number, order date, and status are required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      vendor_id,
      po_number,
      order_date,
      expected_date: expected_date || null,
      notes: notes || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update PO: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
  revalidatePath(`/dashboard/purchase-orders/${id}`);
}

export async function deletePurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Purchase order ID is required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete purchase order: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
}
