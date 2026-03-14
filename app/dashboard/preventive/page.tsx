import {
  createScheduleAction,
  deleteScheduleAction,
  runPmGenerationAction,
} from "@/app/dashboard/preventive/actions";
import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PreventivePage() {
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
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Preventive Maintenance</h2>
          <p className="mt-2 text-slate-600">
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

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={createScheduleAction}
          resetOnSuccess
          successMessage="Schedule saved successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
          <h3 className="text-base font-semibold text-slate-900">Create PM Schedule</h3>
          <div className="mt-4 space-y-3">
            <input
              name="title"
              required
              placeholder="Schedule title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              name="asset_id"
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
              defaultValue={30}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="next_due_date"
              type="date"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <FormSubmitButton
              type="submit"
              pendingText="Saving..."
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save Schedule
            </FormSubmitButton>
          </div>
        </ServerActionForm>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">PM schedules</h4>
                <p className="mt-1 text-xs text-slate-500">Plan recurring preventive maintenance tasks</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {schedules?.length || 0} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Interval</th>
                <th className="px-4 py-3">Next Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules?.length ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-medium text-slate-800">{schedule.title}</td>
                    <td className="px-4 py-4 text-slate-700">{schedule.interval_days} days</td>
                    <td className="px-4 py-4 text-slate-700">{schedule.next_due_date}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/preventive/${schedule.id}`} className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200">
                          View
                        </Link>
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
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No PM schedules yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
