"use server";

import { addDays, isBefore, startOfToday } from "date-fns";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createScheduleAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const intervalDays = Number(formData.get("interval_days") ?? 30);
  const nextDueDate = String(formData.get("next_due_date") ?? "");

  const payload = {
    organization_id: profile.organization_id,
    asset_id: String(formData.get("asset_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    interval_days: intervalDays,
    next_due_date: nextDueDate,
    is_active: true,
    created_by: profile.id,
  };

  if (!payload.asset_id || !payload.title || !payload.next_due_date || intervalDays < 1) {
    return;
  }

  await supabase.from("preventive_schedules").insert(payload);
  revalidatePath("/dashboard/preventive");
}

export async function runPmGenerationAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("preventive_schedules")
    .select("id,asset_id,title,interval_days,next_due_date")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true);

  const today = startOfToday();
  if (!schedules?.length) {
    return;
  }

  for (const schedule of schedules) {
    const due = new Date(schedule.next_due_date);
    if (!isBefore(due, addDays(today, 1))) {
      continue;
    }

    const { data: asset } = await supabase
      .from("assets")
      .select("location_id")
      .eq("id", schedule.asset_id)
      .single();

    if (!asset?.location_id) {
      continue;
    }

    await supabase.from("work_orders").insert({
      organization_id: profile.organization_id,
      location_id: asset.location_id,
      asset_id: schedule.asset_id,
      title: `[PM] ${schedule.title}`,
      description: "Auto-generated from preventive schedule",
      status: "open",
      priority: "medium",
      maintenance_type: "preventive",
      created_by: profile.id,
      due_date: schedule.next_due_date,
    });

    await supabase
      .from("preventive_schedules")
      .update({ next_due_date: addDays(due, schedule.interval_days).toISOString().slice(0, 10) })
      .eq("id", schedule.id)
      .eq("organization_id", profile.organization_id);
  }

  revalidatePath("/dashboard/preventive");
  revalidatePath("/dashboard/work-orders");
}
