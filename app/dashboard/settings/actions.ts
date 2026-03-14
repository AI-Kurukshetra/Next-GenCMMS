"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createLocationAction(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!name) {
    throw new Error("Location name is required");
  }

  const { error } = await supabase.from("locations").insert({
    organization_id: profile.organization_id,
    name,
    code: code || null,
  });

  if (error) {
    throw new Error(`Failed to create location: ${error.message}`);
  }

  revalidatePath("/dashboard/settings");
}

export async function updateOrgNameAction(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Organization name is required");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update organization: ${error.message}`);
  }

  revalidatePath("/dashboard/settings");
}

export async function updateLocationAction(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!id || !name) {
    throw new Error("Location ID and name are required");
  }

  const { error } = await supabase
    .from("locations")
    .update({ name, code: code || null })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update location: ${error.message}`);
  }

  revalidatePath("/dashboard/settings");
}

export async function deleteLocationAction(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Location ID is required");
  }

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete location: ${error.message}`);
  }

  revalidatePath("/dashboard/settings");
}
