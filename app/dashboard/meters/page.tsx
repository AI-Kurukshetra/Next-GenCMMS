import Link from "next/link";
import { createMeterAction, deleteMeterAction, updateMeterAction } from "@/app/dashboard/meters/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

type MeterRecord = {
  id: string;
  asset_id: string;
  meter_type: string;
  unit: string;
  current_reading: number | string | null;
  last_recorded_at: string | null;
  assets:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

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
  const meterRows = (meters ?? []) as MeterRecord[];
  const editingMeter = meterRows.find((meter) => meter.id === editId);

  function getAssetName(meter: MeterRecord) {
    if (Array.isArray(meter.assets)) {
      return meter.assets[0]?.name ?? null;
    }

    return meter.assets?.name ?? null;
  }

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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Equipment meters</h4>
                <p className="mt-1 text-xs text-slate-500">Track equipment operating hours and cycles</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {meterRows.length} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Current Reading</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {meterRows.length ? (
                meterRows.map((meter) => (
                  <tr key={meter.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-medium text-slate-900">{getAssetName(meter) || "-"}</td>
                    <td className="px-4 py-4 capitalize text-slate-600">{meter.meter_type}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {meter.current_reading ?? "-"} {meter.unit}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {meter.last_recorded_at ? formatDateRelative(meter.last_recorded_at) : "Never"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
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
