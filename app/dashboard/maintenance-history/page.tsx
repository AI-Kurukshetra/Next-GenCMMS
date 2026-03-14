import { FilterForm } from "@/components/filter-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

type MaintenanceHistoryRow = {
  id: string;
  asset_id: string;
  event_type: string;
  event_data: unknown;
  performed_by: string | null;
  created_at: string | null;
  assets:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
  performer:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

export default async function MaintenanceHistoryPage({
  searchParams,
}: {
  searchParams?: { asset_id?: string; event_type?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const assetId = searchParams?.asset_id ?? "";
  const eventType = searchParams?.event_type ?? "";

  let query = supabase
    .from("maintenance_history")
    .select(`
      id,
      asset_id,
      event_type,
      event_data,
      performed_by,
      created_at,
      assets(id,name),
      performer:performed_by(id,full_name)
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (assetId) {
    query = query.eq("asset_id", assetId);
  }
  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const [{ data: history }, { data: assets }] = await Promise.all([
    query,
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);
  const historyRows = (history ?? []) as MaintenanceHistoryRow[];

  // Get unique event types
  const eventTypes = Array.from(
    new Set(historyRows.map((h) => h.event_type))
  );

  function getSingleRelation<T>(relation: T | T[] | null): T | null {
    if (Array.isArray(relation)) {
      return relation[0] ?? null;
    }
    return relation ?? null;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Maintenance History</h2>
        <p className="mt-2 text-slate-600">Complete audit trail of all maintenance activities</p>
      </div>

      <FilterForm
        fields={[
          {
            name: 'asset_id',
            label: 'All assets',
            type: 'select',
            options: assets?.map((a) => ({ value: a.id, label: a.name })) || [],
          },
          {
            name: 'event_type',
            label: 'All event types',
            type: 'select',
            options: eventTypes.map((type) => ({ value: type, label: type.replace("_", " ") })),
          },
        ]}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">History records</h4>
              <p className="mt-1 text-xs text-slate-500">Audit trail of maintenance events and updates</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {historyRows.length} total
            </div>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Performed By</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.length ? (
              historyRows.map((h) => (
                <tr key={h.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">{getSingleRelation(h.assets)?.name || "Unknown"}</td>
                  <td className="px-4 py-4 capitalize text-slate-700">{h.event_type.replace("_", " ")}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">
                    {(() => {
                      if (typeof h.event_data === "object" && h.event_data !== null) {
                        return JSON.stringify(h.event_data).substring(0, 50) + "...";
                      }
                      return h.event_data ? String(h.event_data) : "-";
                    })()}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{getSingleRelation(h.performer)?.full_name || "-"}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{h.created_at ? formatDateRelative(h.created_at) : "Date unknown"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No maintenance history yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
