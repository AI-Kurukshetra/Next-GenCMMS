import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

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

  // Get unique event types
  const eventTypes = Array.from(
    new Set((history || []).map((h) => h.event_type))
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Maintenance History</h2>
        <p className="mt-2 text-slate-600">Complete audit trail of all maintenance activities</p>
      </div>

      <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
        <select name="asset_id" defaultValue={assetId} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All assets</option>
          {assets?.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
        <select name="event_type" defaultValue={eventType} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All event types</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
        <div className="col-span-2">
          <button type="submit" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Filter
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Asset</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Event Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Details</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Performed By</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {history?.length ? (
              history.map((h: any) => (
                <tr key={h.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{h.assets?.name || "Unknown"}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{h.event_type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {typeof h.event_data === "object"
                      ? JSON.stringify(h.event_data).substring(0, 50) + "..."
                      : h.event_data || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.performer?.full_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateRelative(h.created_at)}</td>
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
