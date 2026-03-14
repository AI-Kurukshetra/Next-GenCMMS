import { redirect } from "next/navigation";
import { updateMeterAction, updateMeterReadingAction } from "@/app/dashboard/meters/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MeterDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: meter }, { data: assets }] = await Promise.all([
    supabase
      .from("equipment_meters")
      .select("id,asset_id,meter_type,unit,current_reading")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);

  if (!meter) {
    redirect("/dashboard/meters");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Meter Details</h2>
        <p className="mt-2 text-slate-600">Edit meter setup and update readings.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerActionForm
          action={updateMeterAction}
          successMessage="Meter updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-semibold text-slate-900">Edit Meter</h3>
          <input type="hidden" name="id" value={meter.id} />
          <select
            name="asset_id"
            defaultValue={meter.asset_id}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select asset *</option>
            {assets?.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
          <select name="meter_type" defaultValue={meter.meter_type} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Meter type *</option>
            <option value="hours">Hours</option>
            <option value="cycles">Cycles</option>
            <option value="distance">Distance</option>
            <option value="count">Count</option>
          </select>
          <input
            name="unit"
            required
            defaultValue={meter.unit}
            placeholder="Unit (e.g., hrs, km) *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="current_reading"
            type="number"
            min="0"
            step="0.01"
            defaultValue={meter.current_reading ?? ""}
            placeholder="Current reading"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Updating..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Update Meter
          </FormSubmitButton>
        </ServerActionForm>

        <ServerActionForm
          action={updateMeterReadingAction}
          successMessage="Reading updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-semibold text-slate-900">Quick Reading Update</h3>
          <input type="hidden" name="id" value={meter.id} />
          <input
            name="current_reading"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Enter latest reading"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white hover:bg-slate-700"
          >
            Save Reading
          </FormSubmitButton>
        </ServerActionForm>
      </div>
    </section>
  );
}
