import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,body,is_read,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Notifications</h2>
        <p className="mt-2 text-slate-600">System alerts and updates</p>
      </div>

      <div className="space-y-2">
        {notifications?.length ? notifications.map((n) => (
          <div key={n.id} className={`rounded-lg border p-4 ${n.is_read ? 'border-slate-200 bg-white' : 'border-blue-300 bg-blue-50'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{n.title}</h3>
                {n.body && <p className="mt-1 text-sm text-slate-600">{n.body}</p>}
              </div>
              <span className="text-xs text-slate-500">{formatDateRelative(n.created_at)}</span>
            </div>
          </div>
        )) : <div className="text-center py-8 text-slate-500">No notifications yet</div>}
      </div>
    </section>
  );
}
