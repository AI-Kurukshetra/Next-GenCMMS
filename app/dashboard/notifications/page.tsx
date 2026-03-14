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

      <div className="space-y-2">
        {notifications?.length ? (
          notifications.map((n) => (
            <div key={n.id} className={`rounded-lg border p-4 ${n.is_read ? "border-slate-200 bg-white" : "border-blue-300 bg-blue-50"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{n.title}</h3>
                  {n.body && <p className="mt-1 text-sm text-slate-600">{n.body}</p>}
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xs text-slate-500">{formatDateRelative(n.created_at)}</span>
                  {!n.is_read && (
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
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">No notifications yet</div>
        )}
      </div>
    </section>
  );
}
