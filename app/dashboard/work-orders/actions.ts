"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    asset_id: String(formData.get("asset_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "medium"),
    maintenance_type: String(formData.get("maintenance_type") ?? "corrective"),
    assigned_to: String(formData.get("assigned_to") ?? "") || null,
    due_date: String(formData.get("due_date") ?? "") || null,
    status: "open",
    created_by: profile.id,
  };

  if (!payload.title || !payload.asset_id || !payload.location_id) {
    return;
  }

  const { error } = await supabase.from("work_orders").insert(payload);

  if (error) {
    return;
  }

  revalidatePath("/dashboard/work-orders");
}

export async function updateWorkOrderStatusAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "open");

  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("work_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard/work-orders");
}

export async function updateWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const assigned_to = String(formData.get("assigned_to") ?? "") || null;
  const due_date = String(formData.get("due_date") ?? "") || null;
  const maintenance_type = String(formData.get("maintenance_type") ?? "corrective");

  if (!id || !title) {
    return;
  }

  const { error } = await supabase
    .from("work_orders")
    .update({
      title,
      description: description || null,
      priority,
      assigned_to,
      due_date,
      maintenance_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard/work-orders");
  revalidatePath(`/dashboard/work-orders/${id}`);
}

export async function closeWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const closure_notes = String(formData.get("closure_notes") ?? "").trim();

  if (!id || !closure_notes) {
    return;
  }

  const { error } = await supabase
    .from("work_orders")
    .update({
      status: "completed",
      closure_notes,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return;
  }

  revalidatePath("/dashboard/work-orders");
  revalidatePath(`/dashboard/work-orders/${id}`);
}

export async function logTimeAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const work_order_id = String(formData.get("work_order_id") ?? "");
  const minutes_spent = Number(formData.get("minutes_spent") ?? 0);
  const labor_cost = formData.get("labor_cost") ? Number(formData.get("labor_cost")) : null;

  if (!work_order_id || minutes_spent <= 0) {
    return;
  }

  const { error } = await supabase.from("work_order_time_logs").insert({
    organization_id: profile.organization_id,
    work_order_id,
    technician_id: profile.id,
    minutes_spent,
    labor_cost,
  });

  if (error) {
    return;
  }

  revalidatePath(`/dashboard/work-orders/${work_order_id}`);
}

export async function addPartUsageAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const work_order_id = String(formData.get("work_order_id") ?? "");
  const part_id = String(formData.get("part_id") ?? "");
  const quantity_used = Number(formData.get("quantity_used") ?? 0);

  if (!work_order_id || !part_id || quantity_used <= 0) {
    return;
  }

  // Get part unit cost
  const { data: part } = await supabase
    .from("inventory_parts")
    .select("unit_cost, quantity_on_hand")
    .eq("id", part_id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!part) {
    return;
  }

  // Check stock
  if (part.quantity_on_hand < quantity_used) {
    return;
  }

  // Add part usage record
  const { error: usageError } = await supabase.from("work_order_parts").insert({
    organization_id: profile.organization_id,
    work_order_id,
    part_id,
    quantity_used,
    unit_cost: part.unit_cost,
  });

  if (usageError) {
    return;
  }

  // Update inventory stock
  const { error: stockError } = await supabase
    .from("inventory_parts")
    .update({ quantity_on_hand: part.quantity_on_hand - quantity_used })
    .eq("id", part_id);

  if (stockError) {
    return;
  }

  revalidatePath(`/dashboard/work-orders/${work_order_id}`);
  revalidatePath("/dashboard/inventory");
}
