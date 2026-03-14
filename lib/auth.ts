import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "maintenance_manager" | "technician";

export type Profile = {
  id: string;
  organization_id: string;
  role: UserRole;
  full_name: string | null;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireProfile(): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return profile as Profile;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
