"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const assignedTo = String(formData.get("assigned_to") ?? "").trim();

  if (assignedTo) {
    const { data: technician } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .eq("role", "technician")
      .maybeSingle();

    if (!technician) {
      throw new Error("Selected technician is invalid.");
    }
  }

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    asset_id: String(formData.get("asset_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "medium"),
    maintenance_type: String(formData.get("maintenance_type") ?? "corrective"),
    assigned_to: assignedTo || null,
    due_date: String(formData.get("due_date") ?? "") || null,
    status: assignedTo ? "assigned" : "open",
    created_by: profile.id,
  };

  if (!payload.title || !payload.asset_id || !payload.location_id) {
    throw new Error("Title, asset, and location are required.");
  }

  const { error } = await supabase.from("work_orders").insert(payload);

  if (error) {
    throw new Error(`Failed to create work order: ${error.message}`);
  }

  revalidatePath("/dashboard/work-orders");
}

export async function updateWorkOrderStatusAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "open");
  const allowedStatuses = new Set(["open", "assigned", "in_progress", "completed", "cancelled"]);

  if (!id || !allowedStatuses.has(status)) {
    throw new Error("Valid work order ID and status are required.");
  }

  const { error } = await supabase
    .from("work_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update work order status: ${error.message}`);
  }

  revalidatePath("/dashboard/work-orders");
}

export async function updateWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const location_id = String(formData.get("location_id") ?? "");
  const asset_id = String(formData.get("asset_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const assignedTo = String(formData.get("assigned_to") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "") || null;
  const maintenance_type = String(formData.get("maintenance_type") ?? "corrective");

  if (!id || !title || !location_id || !asset_id) {
    throw new Error("Work order ID, title, location, and asset are required.");
  }
  if (assignedTo) {
    const { data: technician } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("organization_id", profile.organization_id)
      .eq("role", "technician")
      .maybeSingle();

    if (!technician) {
      throw new Error("Selected technician is invalid.");
    }
  }

  const { data: existingWorkOrder } = await supabase
    .from("work_orders")
    .select("status")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  const nextStatus =
    assignedTo && existingWorkOrder?.status === "open"
      ? "assigned"
      : existingWorkOrder?.status;

  const { error } = await supabase
    .from("work_orders")
    .update({
      title,
      location_id,
      asset_id,
      description: description || null,
      priority,
      assigned_to: assignedTo || null,
      due_date,
      maintenance_type,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update work order: ${error.message}`);
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
    throw new Error("Work order ID and closure notes are required.");
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
    throw new Error(`Failed to close work order: ${error.message}`);
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

  if (!work_order_id || Number.isNaN(minutes_spent) || minutes_spent <= 0) {
    throw new Error("Work order and positive minutes are required.");
  }
  if (labor_cost !== null && (Number.isNaN(labor_cost) || labor_cost < 0)) {
    throw new Error("Labor cost must be 0 or greater.");
  }

  const { error } = await supabase.from("work_order_time_logs").insert({
    organization_id: profile.organization_id,
    work_order_id,
    technician_id: profile.id,
    minutes_spent,
    labor_cost,
  });

  if (error) {
    throw new Error(`Failed to log time: ${error.message}`);
  }

  revalidatePath(`/dashboard/work-orders/${work_order_id}`);
}

export async function addPartUsageAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const work_order_id = String(formData.get("work_order_id") ?? "");
  const part_id = String(formData.get("part_id") ?? "");
  const quantity_used = Number(formData.get("quantity_used") ?? 0);

  if (!work_order_id || !part_id || Number.isNaN(quantity_used) || quantity_used <= 0) {
    throw new Error("Work order, part, and positive quantity are required.");
  }

  // Get part unit cost
  const { data: part } = await supabase
    .from("inventory_parts")
    .select("unit_cost, quantity_on_hand")
    .eq("id", part_id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!part) {
    throw new Error("Inventory part not found.");
  }

  // Check stock
  if (part.quantity_on_hand < quantity_used) {
    throw new Error("Insufficient stock for selected part.");
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
    throw new Error(`Failed to add part usage: ${usageError.message}`);
  }

  // Update inventory stock
  const { error: stockError } = await supabase
    .from("inventory_parts")
    .update({ quantity_on_hand: part.quantity_on_hand - quantity_used })
    .eq("id", part_id);

  if (stockError) {
    throw new Error(`Failed to update inventory stock: ${stockError.message}`);
  }

  revalidatePath(`/dashboard/work-orders/${work_order_id}`);
  revalidatePath("/dashboard/inventory");
}

export async function deleteWorkOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Work order ID is required.");
  }

  const { error } = await supabase
    .from("work_orders")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete work order: ${error.message}`);
  }

  revalidatePath("/dashboard/work-orders");
}
