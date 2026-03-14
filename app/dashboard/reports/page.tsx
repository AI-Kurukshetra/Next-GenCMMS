import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CSVExportButton } from "@/components/csv-export-button";
import { calculateProgressPercent } from "@/lib/utils";
import { format, isAfter, startOfMonth, subMonths } from "date-fns";

type WorkOrderRow = {
  id: string;
  asset_id: string | null;
  status: string;
  priority: string;
  created_at: string;
  assets:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

export default async function ReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    { data: workOrdersData },
    { count: totalWOs },
    { count: completedWOs },
    { count: totalAssets },
    { count: activeAssets },
    { count: activePmSchedules },
  ] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id,asset_id,status,priority,created_at,assets(name)")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id).eq("status", "completed"),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id).eq("status", "active"),
    supabase
      .from("preventive_schedules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true),
  ]);

  const workOrders = (workOrdersData ?? []) as WorkOrderRow[];
  const totalWOCount = totalWOs ?? 0;
  const completedWOCount = completedWOs ?? 0;
  const totalAssetCount = totalAssets ?? 0;
  const activeAssetCount = activeAssets ?? 0;
  const activePmCount = activePmSchedules ?? 0;
  const openCriticalCount = workOrders.filter(
    (wo) => wo.status !== "completed" && (wo.priority === "high" || wo.priority === "critical")
  ).length;

  const completionRate = calculateProgressPercent(completedWOCount, totalWOCount || 1);
  const assetUptime = calculateProgressPercent(activeAssetCount, totalAssetCount || 1);
  const pmCoverage = calculateProgressPercent(activePmCount, totalAssetCount || 1);

  const monthlyBuckets = Array.from({ length: 6 }, (_, idx) => {
    const monthDate = startOfMonth(subMonths(new Date(), 5 - idx));
    return {
      key: format(monthDate, "yyyy-MM"),
      label: format(monthDate, "MMM yyyy"),
      total: 0,
      completed: 0,
    };
  });

  const monthMap = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]));
  for (const wo of workOrders) {
    if (!isAfter(new Date(wo.created_at), new Date(subMonths(new Date(), 6)))) {
      continue;
    }
    const monthKey = format(new Date(wo.created_at), "yyyy-MM");
    const bucket = monthMap.get(monthKey);
    if (!bucket) continue;
    bucket.total += 1;
    if (wo.status === "completed") {
      bucket.completed += 1;
    }
  }
  const maxMonthlyTotal = Math.max(...monthlyBuckets.map((b) => b.total), 1);

  const assetIssueMap = new Map<string, { assetName: string; woCount: number; openCount: number; criticalCount: number }>();
  for (const wo of workOrders) {
    if (!wo.asset_id) continue;
    const assetName = Array.isArray(wo.assets) ? wo.assets[0]?.name : wo.assets?.name;
    const current = assetIssueMap.get(wo.asset_id) ?? {
      assetName: assetName ?? "Unknown Asset",
      woCount: 0,
      openCount: 0,
      criticalCount: 0,
    };
    current.woCount += 1;
    if (wo.status !== "completed") current.openCount += 1;
    if (wo.priority === "critical") current.criticalCount += 1;
    assetIssueMap.set(wo.asset_id, current);
  }
  const topFailingAssets = Array.from(assetIssueMap.entries())
    .map(([assetId, value]) => ({ assetId, ...value }))
    .sort((a, b) => b.woCount - a.woCount)
    .slice(0, 10);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Reports</h2>
        <p className="mt-2 text-slate-600">Operations analytics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ReportCard label="Total Work Orders" value={totalWOCount} icon="📊" />
        <ReportCard label="Completion Rate" value={`${completionRate}%`} icon="✓" />
        <ReportCard label="Total Assets" value={totalAssetCount} icon="🏭" />
        <ReportCard label="Asset Uptime" value={`${assetUptime}%`} icon="🔋" />
        <ReportCard label="Open High/Critical" value={openCriticalCount} icon="⚠️" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Monthly Work Order Trend</h3>
                <p className="mt-1 text-xs text-slate-500">Last 6 months (Created vs Completed)</p>
              </div>
              <CSVExportButton
                data={monthlyBuckets.map((b) => ({ month: b.label, total: b.total, completed: b.completed }))}
                columns={["month", "total", "completed"]}
                filename="work-order-trend"
              />
            </div>
          </div>
          <div className="space-y-3 p-4">
            {monthlyBuckets.map((bucket) => (
              <div key={bucket.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{bucket.label}</span>
                  <span className="text-slate-500">
                    {bucket.completed}/{bucket.total} completed
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                    style={{ width: `${(bucket.total / maxMonthlyTotal) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/90"
                    style={{ width: bucket.total ? `${(bucket.completed / maxMonthlyTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-900">Key Metrics</h3>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Completion Rate</span>
                <span className="font-bold text-indigo-600">{completionRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Asset Uptime</span>
                <span className="font-bold text-green-600">{assetUptime}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-green-600" style={{ width: `${assetUptime}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">PM Coverage</span>
                <span className="font-bold text-orange-600">{pmCoverage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: `${pmCoverage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top Failing Assets</h3>
              <p className="mt-1 text-xs text-slate-500">Assets with highest work order volume</p>
            </div>
            <CSVExportButton
              data={topFailingAssets}
              columns={["assetName", "woCount", "openCount", "criticalCount"]}
              filename="top-failing-assets"
            />
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Total WO</th>
              <th className="px-4 py-3">Open WO</th>
              <th className="px-4 py-3">Critical WO</th>
            </tr>
          </thead>
          <tbody>
            {topFailingAssets.length ? (
              topFailingAssets.map((asset) => (
                <tr key={asset.assetId} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">{asset.assetName}</td>
                  <td className="px-4 py-4 text-slate-700">{asset.woCount}</td>
                  <td className="px-4 py-4 text-slate-700">{asset.openCount}</td>
                  <td className="px-4 py-4 text-slate-700">{asset.criticalCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No work order data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
