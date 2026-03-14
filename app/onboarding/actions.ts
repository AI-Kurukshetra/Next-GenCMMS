"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function completeOnboardingAction(formData: FormData) {
  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const locationName = String(formData.get("location_name") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!organizationName || !locationName) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    redirect("/dashboard");
  }

  // Use service role to create organization (bypasses RLS for initial setup)
  const serviceRoleClient = createServiceRoleClient();
  const { data: organization, error: orgError } = await serviceRoleClient
    .from("organizations")
    .insert({ name: organizationName })
    .select("id")
    .single();

  if (orgError || !organization) {
    redirect(`/onboarding?error=${encodeURIComponent(orgError?.message ?? "Failed to create organization")}`);
  }

  // Create profile for the authenticated user
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    organization_id: organization.id,
    role: "admin",
    full_name: fullName || user.email,
  });

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`);
  }

  // Create default location
  const { error: locationError } = await supabase.from("locations").insert({
    organization_id: organization.id,
    name: locationName,
    code: "HQ",
  });

  if (locationError) {
    redirect(`/onboarding?error=${encodeURIComponent(locationError.message)}`);
  }

  redirect("/dashboard");
}
