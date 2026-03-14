import Link from "next/link";
import { createMeterAction, deleteMeterAction, updateMeterAction } from "@/app/dashboard/meters/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

export default async function MetersPage({
  searchParams,
}: {
  searchParams?: { edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: meters }, { data: assets }] = await Promise.all([
    supabase
      .from("equipment_meters")
      .select("id,asset_id,meter_type,unit,current_reading,last_recorded_at,assets(id,name)")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);
  const editId = (searchParams?.edit_id ?? "").trim();
  const editingMeter = meters?.find((meter) => meter.id === editId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Equipment Meters</h2>
        <p className="mt-2 text-slate-600">Track asset performance metrics and readings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={editingMeter ? updateMeterAction : createMeterAction}
          resetOnSuccess={!editingMeter}
          successMessage={editingMeter ? "Meter updated successfully." : "Meter created successfully."}
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">{editingMeter ? "Edit Meter" : "Create Meter"}</h3>
          {editingMeter && <input type="hidden" name="id" value={editingMeter.id} />}
          <select
            name="asset_id"
            defaultValue={editingMeter?.asset_id ?? ""}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select asset *</option>
            {assets?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="meter_type" defaultValue={editingMeter?.meter_type ?? ""} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Meter type *</option>
            <option value="hours">Hours</option>
            <option value="cycles">Cycles</option>
            <option value="distance">Distance</option>
            <option value="count">Count</option>
          </select>
          <input
            name="unit"
            required
            defaultValue={editingMeter?.unit ?? ""}
            placeholder="Unit (e.g., hrs, km) *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="current_reading"
            type="number"
            min="0"
            step="0.01"
            defaultValue={editingMeter?.current_reading ?? ""}
            placeholder="Initial reading"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText={editingMeter ? "Updating..." : "Saving..."}
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            {editingMeter ? "Update Meter" : "Create Meter"}
          </FormSubmitButton>
          {editingMeter && (
            <Link href="/dashboard/meters" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
              Cancel Edit
            </Link>
          )}
        </ServerActionForm>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Asset</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Current Reading</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Updated</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meters?.length ? (
                meters.map((meter: any) => (
                  <tr key={meter.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{meter.assets?.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{meter.meter_type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {meter.current_reading ?? "-"} {meter.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {meter.last_recorded_at ? formatDateRelative(meter.last_recorded_at) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <form action={deleteMeterAction}>
                          <input type="hidden" name="id" value={meter.id} />
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
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No meters yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
