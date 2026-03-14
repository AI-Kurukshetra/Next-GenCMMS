"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAssetAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim() || null,
    serial_number: String(formData.get("serial_number") ?? "").trim() || null,
    manufacturer: String(formData.get("manufacturer") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active"),
  };

  if (!payload.name || !payload.location_id) {
    return;
  }

  await supabase.from("assets").insert(payload);
  revalidatePath("/dashboard/assets");
}
