"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createComplianceRecordAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const asset_id = String(formData.get("asset_id") ?? "").trim();
  const inspection_type = String(formData.get("inspection_type") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!asset_id || !inspection_type || !due_date) {
    throw new Error("Asset, inspection type, and due date are required");
  }

  const { error } = await supabase.from("compliance_records").insert({
    organization_id: profile.organization_id,
    asset_id,
    inspection_type,
    due_date,
    status: "pending",
    notes: notes || null,
  });

  if (error) {
    throw new Error(`Failed to create compliance record: ${error.message}`);
  }

  revalidatePath("/dashboard/compliance");
}

export async function updateComplianceStatusAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["pending", "passed", "failed", "overdue"]);
  if (!id || !status || !allowedStatuses.has(status)) {
    throw new Error("Valid compliance record ID and status are required.");
  }
  const completed_date = status === "passed" || status === "failed" ? new Date().toISOString().split("T")[0] : null;

  const { error } = await supabase
    .from("compliance_records")
    .update({ status, completed_date, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update compliance record: ${error.message}`);
  }

  revalidatePath("/dashboard/compliance");
}

export async function updateComplianceRecordAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const asset_id = String(formData.get("asset_id") ?? "").trim();
  const inspection_type = String(formData.get("inspection_type") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !asset_id || !inspection_type || !due_date) {
    throw new Error("Record ID, asset, inspection type, and due date are required.");
  }

  const { error } = await supabase
    .from("compliance_records")
    .update({
      asset_id,
      inspection_type,
      due_date,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update compliance record: ${error.message}`);
  }

  revalidatePath("/dashboard/compliance");
}

export async function deleteComplianceRecordAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Compliance record ID is required.");
  }

  const { error } = await supabase
    .from("compliance_records")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete compliance record: ${error.message}`);
  }

  revalidatePath("/dashboard/compliance");
}
