import {
  createScheduleAction,
  runPmGenerationAction,
} from "@/app/dashboard/preventive/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PreventivePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: schedules }, { data: assets }] = await Promise.all([
    supabase
      .from("preventive_schedules")
      .select("id,title,interval_days,next_due_date,is_active")
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
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Preventive Maintenance</h2>
          <p className="mt-1 text-sm text-slate-600">
            Calendar-based PM schedule definitions with auto generation.
          </p>
        </div>
        <form action={runPmGenerationAction}>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Run PM Generation
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={createScheduleAction} className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">Create PM Schedule</h3>
          <div className="mt-4 space-y-3">
            <input name="title" required placeholder="Schedule title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select name="asset_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select asset</option>
              {assets?.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <input name="interval_days" type="number" min={1} defaultValue={30} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="next_due_date" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Save Schedule
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Interval</th>
                <th className="px-3 py-2">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {schedules?.length ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{schedule.title}</td>
                    <td className="px-3 py-2 text-slate-700">{schedule.interval_days} days</td>
                    <td className="px-3 py-2 text-slate-700">{schedule.next_due_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">No PM schedules yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
