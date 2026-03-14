"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createInventoryPartAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim() || null,
    quantity_on_hand: Number(formData.get("quantity_on_hand") ?? 0),
    reorder_threshold: Number(formData.get("reorder_threshold") ?? 0),
    unit_cost: Number(formData.get("unit_cost") ?? 0),
  };

  if (!payload.name || !payload.location_id) {
    return;
  }

  await supabase.from("inventory_parts").insert(payload);
  revalidatePath("/dashboard/inventory");
}
