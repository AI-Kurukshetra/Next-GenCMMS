import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/dashboard/notifications/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
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

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Notifications</h2>
          <p className="mt-2 text-slate-600">System alerts and updates</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <FormSubmitButton
              type="submit"
              pendingText="Updating..."
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mark All as Read
            </FormSubmitButton>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Recent notifications</h4>
              <p className="mt-1 text-xs text-slate-500">System alerts, reminders, and updates.</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {notifications?.length || 0} total
            </div>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications?.length ? (
              notifications.map((n) => (
                <tr key={n.id} className={`border-t border-slate-100 transition hover:bg-slate-50/80 ${n.is_read ? "" : "bg-blue-50/40"}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                      <span className="font-semibold text-slate-900">{n.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{n.body || "-"}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{formatDateRelative(n.created_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end">
                      {!n.is_read ? (
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="id" value={n.id} />
                          <FormSubmitButton
                            type="submit"
                            pendingText="Updating..."
                            className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Mark Read
                          </FormSubmitButton>
                        </form>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Read</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No notifications yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
