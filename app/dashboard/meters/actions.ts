"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createMeterAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const asset_id = String(formData.get("asset_id") ?? "").trim();
  const meter_type = String(formData.get("meter_type") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const current_reading = String(formData.get("current_reading") ?? "").trim();

  if (!asset_id || !meter_type || !unit) {
    throw new Error("Asset, meter type, and unit are required");
  }
  const parsedCurrentReading = current_reading ? Number(current_reading) : null;
  if (parsedCurrentReading !== null && (Number.isNaN(parsedCurrentReading) || parsedCurrentReading < 0)) {
    throw new Error("Current reading must be 0 or greater.");
  }

  const { error } = await supabase.from("equipment_meters").insert({
    organization_id: profile.organization_id,
    asset_id,
    meter_type,
    unit,
    current_reading: parsedCurrentReading,
    last_recorded_at: parsedCurrentReading !== null ? new Date().toISOString() : null,
  });

  if (error) {
    throw new Error(`Failed to create meter: ${error.message}`);
  }

  revalidatePath("/dashboard/meters");
}

export async function updateMeterReadingAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const current_reading = String(formData.get("current_reading") ?? "").trim();

  if (!id) {
    throw new Error("Meter ID is required");
  }
  const reading = Number(current_reading);
  if (!current_reading || Number.isNaN(reading) || reading < 0) {
    throw new Error("Reading value is required and must be 0 or greater.");
  }

  const { error } = await supabase
    .from("equipment_meters")
    .update({
      current_reading: reading,
      last_recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update meter: ${error.message}`);
  }

  revalidatePath("/dashboard/meters");
}

export async function updateMeterAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const asset_id = String(formData.get("asset_id") ?? "").trim();
  const meter_type = String(formData.get("meter_type") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const current_reading = String(formData.get("current_reading") ?? "").trim();

  if (!id || !asset_id || !meter_type || !unit) {
    throw new Error("Meter ID, asset, type, and unit are required.");
  }

  const reading = current_reading ? Number(current_reading) : null;
  if (reading !== null && (Number.isNaN(reading) || reading < 0)) {
    throw new Error("Current reading must be 0 or greater.");
  }

  const { error } = await supabase
    .from("equipment_meters")
    .update({
      asset_id,
      meter_type,
      unit,
      current_reading: reading,
      last_recorded_at: reading !== null ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update meter: ${error.message}`);
  }

  revalidatePath("/dashboard/meters");
}

export async function deleteMeterAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Meter ID is required.");
  }

  const { error } = await supabase
    .from("equipment_meters")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete meter: ${error.message}`);
  }

  revalidatePath("/dashboard/meters");
}
