import {
  createScheduleAction,
  deleteScheduleAction,
  runPmGenerationAction,
  updateScheduleAction,
} from "@/app/dashboard/preventive/actions";
import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PreventivePage({
  searchParams,
}: {
  searchParams?: { edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: schedules }, { data: assets }] = await Promise.all([
    supabase
      .from("preventive_schedules")
      .select("id,asset_id,title,interval_days,next_due_date,is_active")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
  ]);
  const editId = (searchParams?.edit_id ?? "").trim();
  const editingSchedule = schedules?.find((schedule) => schedule.id === editId);

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Preventive Maintenance</h2>
          <p className="mt-1 text-sm text-slate-600">
            Calendar-based PM schedule definitions with auto generation.
          </p>
        </div>
        <form action={runPmGenerationAction}>
          <FormSubmitButton
            pendingText="Running..."
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Run PM Generation
          </FormSubmitButton>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={editingSchedule ? updateScheduleAction : createScheduleAction}
          resetOnSuccess={!editingSchedule}
          successMessage={editingSchedule ? "Schedule updated successfully." : "Schedule saved successfully."}
          className="rounded-xl border border-slate-200 p-4"
        >
          <h3 className="text-base font-semibold text-slate-900">{editingSchedule ? "Edit PM Schedule" : "Create PM Schedule"}</h3>
          <div className="mt-4 space-y-3">
            {editingSchedule && <input type="hidden" name="id" value={editingSchedule.id} />}
            <input
              name="title"
              defaultValue={editingSchedule?.title ?? ""}
              required
              placeholder="Schedule title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              name="asset_id"
              defaultValue={editingSchedule?.asset_id ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select asset</option>
              {assets?.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <input
              name="interval_days"
              type="number"
              min={1}
              required
              defaultValue={editingSchedule?.interval_days ?? 30}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="next_due_date"
              type="date"
              defaultValue={editingSchedule?.next_due_date ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <FormSubmitButton
              type="submit"
              pendingText={editingSchedule ? "Updating..." : "Saving..."}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {editingSchedule ? "Update Schedule" : "Save Schedule"}
            </FormSubmitButton>
            {editingSchedule && (
              <Link href="/dashboard/preventive" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
                Cancel Edit
              </Link>
            )}
          </div>
        </ServerActionForm>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Interval</th>
                <th className="px-3 py-2">Next Due</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules?.length ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{schedule.title}</td>
                    <td className="px-3 py-2 text-slate-700">{schedule.interval_days} days</td>
                    <td className="px-3 py-2 text-slate-700">{schedule.next_due_date}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <form action={deleteScheduleAction}>
                          <input type="hidden" name="id" value={schedule.id} />
                          <FormSubmitButton
                            type="submit"
                            pendingText="Deleting..."
                            className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                          >
                            Delete
                          </FormSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No PM schedules yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
