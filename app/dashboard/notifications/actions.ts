"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Notification ID is required");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    throw new Error(`Failed to mark notification: ${error.message}`);
  }

  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsReadAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(`Failed to mark all notifications: ${error.message}`);
  }

  revalidatePath("/dashboard/notifications");
}
