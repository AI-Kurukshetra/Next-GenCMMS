"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createVendorAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const services = String(formData.get("services") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const performance_score = String(formData.get("performance_score") ?? "").trim();

  if (!name) {
    throw new Error("Vendor name is required");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid vendor email.");
  }
  if (performance_score) {
    const score = Number(performance_score);
    if (Number.isNaN(score) || score < 0 || score > 5) {
      throw new Error("Performance score must be between 0 and 5.");
    }
  }

  const { error } = await supabase.from("vendors").insert({
    organization_id: profile.organization_id,
    name,
    services: services || null,
    contact_name: contact_name || null,
    email: email || null,
    phone: phone || null,
    performance_score: performance_score ? parseFloat(performance_score) : null,
  });

  if (error) {
    throw new Error(`Failed to create vendor: ${error.message}`);
  }

  revalidatePath("/dashboard/vendors");
}

export async function updateVendorAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const services = String(formData.get("services") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const performance_score = String(formData.get("performance_score") ?? "").trim();

  if (!id || !name) {
    throw new Error("Vendor ID and name are required.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid vendor email.");
  }

  const parsedScore = performance_score ? Number(performance_score) : null;
  if (parsedScore !== null && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5)) {
    throw new Error("Performance score must be between 0 and 5.");
  }

  const { error } = await supabase
    .from("vendors")
    .update({
      name,
      services: services || null,
      contact_name: contact_name || null,
      email: email || null,
      phone: phone || null,
      performance_score: parsedScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update vendor: ${error.message}`);
  }

  revalidatePath("/dashboard/vendors");
}

export async function deleteVendorAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Vendor ID is required.");
  }

  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete vendor: ${error.message}`);
  }

  revalidatePath("/dashboard/vendors");
}
