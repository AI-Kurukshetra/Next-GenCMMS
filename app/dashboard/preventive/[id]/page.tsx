import { redirect } from "next/navigation";
import { updateScheduleAction } from "@/app/dashboard/preventive/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PreventiveScheduleDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: schedule }, { data: assets }] = await Promise.all([
    supabase
      .from("preventive_schedules")
      .select("id,asset_id,title,interval_days,next_due_date")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
  ]);

  if (!schedule) {
    redirect("/dashboard/preventive");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">PM Schedule Details</h2>
        <p className="mt-2 text-slate-600">Update preventive maintenance schedule details.</p>
      </div>

      <ServerActionForm
        action={updateScheduleAction}
        successMessage="Schedule updated successfully."
        className="max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
      >
        <h3 className="text-base font-semibold text-slate-900">Edit PM Schedule</h3>
        <input type="hidden" name="id" value={schedule.id} />
        <input
          name="title"
          defaultValue={schedule.title}
          required
          placeholder="Schedule title"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="asset_id"
          defaultValue={schedule.asset_id}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select asset</option>
          {assets?.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
        <input
          name="interval_days"
          type="number"
          min={1}
          required
          defaultValue={schedule.interval_days}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="next_due_date"
          type="date"
          defaultValue={schedule.next_due_date}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <FormSubmitButton
          type="submit"
          pendingText="Updating..."
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Update Schedule
        </FormSubmitButton>
      </ServerActionForm>
    </section>
  );
}
