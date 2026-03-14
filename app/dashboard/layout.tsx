import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  async function signOutAction() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={profile.full_name ?? "User"}
      role={profile.role}
      signOutAction={signOutAction}
      unreadNotifications={unreadCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
