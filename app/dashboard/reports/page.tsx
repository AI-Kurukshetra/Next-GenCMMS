import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calculateProgressPercent } from "@/lib/utils";

export default async function ReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    { count: totalWOs },
    { count: completedWOs },
    { count: totalAssets },
    { count: activeAssets },
  ] = await Promise.all([
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id).eq("status", "completed"),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("organization_id", profile.organization_id).eq("status", "active"),
  ]);

  const totalWOCount = totalWOs ?? 0;
  const completedWOCount = completedWOs ?? 0;
  const totalAssetCount = totalAssets ?? 0;
  const activeAssetCount = activeAssets ?? 0;

  const completionRate = calculateProgressPercent(completedWOCount, totalWOCount || 1);
  const assetUptime = calculateProgressPercent(activeAssetCount, totalAssetCount || 1);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Reports</h2>
        <p className="mt-2 text-slate-600">Operations analytics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportCard label="Total Work Orders" value={totalWOCount} icon="📊" />
        <ReportCard label="Completion Rate" value={`${completionRate}%`} icon="✓" />
        <ReportCard label="Total Assets" value={totalAssetCount} icon="🏭" />
        <ReportCard label="Asset Uptime" value={`${assetUptime}%`} icon="🔋" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Key Metrics</h3>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Completion Rate</span>
              <span className="font-bold text-indigo-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Asset Uptime</span>
              <span className="font-bold text-green-600">{assetUptime}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${assetUptime}%` }} />
            </div>
          </div>
        </div>
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
