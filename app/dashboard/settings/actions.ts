"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
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

export async function createTechnicianAction(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const serviceRoleClient = createServiceRoleClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName || !email || !password) {
    throw new Error("Full name, email, and password are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const { data: createdUser, error: createUserError } = await serviceRoleClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserError || !createdUser.user) {
    throw new Error(`Failed to create technician login: ${createUserError?.message ?? "Unknown error"}`);
  }

  const userId = createdUser.user.id;
  const { error: profileError } = await serviceRoleClient.from("profiles").insert({
    id: userId,
    organization_id: profile.organization_id,
    role: "technician",
    full_name: fullName,
    phone: phone || null,
  });

  if (profileError) {
    await serviceRoleClient.auth.admin.deleteUser(userId);
    throw new Error(`Failed to create technician profile: ${profileError.message}`);
  }

  revalidatePath("/dashboard/settings");
}
