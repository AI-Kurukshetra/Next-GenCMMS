import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  calculateProgressPercent,
  formatDate,
  formatDateRelative,
  getPriorityColor,
  getStatusColor,
} from "@/lib/utils";

type StatusRow = { status: string | null };

type InventoryRow = {
  quantity_on_hand: number | null;
  reorder_threshold: number | null;
};

type WorkOrderRow = {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
};

type PreventiveRow = {
  id: string;
  title: string;
  next_due_date: string;
};

type AssetRow = {
  id: string;
  name: string;
  status: string;
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    totalAssetsRes,
    activeAssetsRes,
    openWOsRes,
    inProgressWOsRes,
    completedWOsRes,
    overduePMsRes,
    recentWOsRes,
    assetStatusRes,
    woStatusRes,
    inventoryRes,
    upcomingPMRes,
    criticalAssetsRes,
  ] = await Promise.all([
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "active"),
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "open"),
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "in_progress"),
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed"),
    supabase
      .from("preventive_schedules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .lt("next_due_date", new Date().toISOString().slice(0, 10)),
    supabase
      .from("work_orders")
      .select("id,title,priority,status,due_date,created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("assets")
      .select("status")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("work_orders")
      .select("status")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("inventory_parts")
      .select("quantity_on_hand,reorder_threshold")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("preventive_schedules")
      .select("id,title,next_due_date")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("next_due_date", { ascending: true })
      .limit(4),
    supabase
      .from("assets")
      .select("id,name,status")
      .eq("organization_id", profile.organization_id)
      .eq("status", "under_maintenance")
      .limit(4),
  ]);

  const totalAssets = totalAssetsRes.count ?? 0;
  const activeAssets = activeAssetsRes.count ?? 0;
  const openWOs = openWOsRes.count ?? 0;
  const inProgressWOs = inProgressWOsRes.count ?? 0;
  const completedWOs = completedWOsRes.count ?? 0;
  const overduePMs = overduePMsRes.count ?? 0;

  const inventoryRows = (inventoryRes.data ?? []) as InventoryRow[];
  const lowInventoryCount = inventoryRows.filter((row) => {
    const qty = Number(row.quantity_on_hand ?? 0);
    const threshold = Number(row.reorder_threshold ?? 0);
    return qty <= threshold;
  }).length;

  const totalWOs = openWOs + inProgressWOs + completedWOs;
  const assetUptime = calculateProgressPercent(activeAssets, totalAssets);
  const pmComplianceRate = calculateProgressPercent(completedWOs, totalWOs);

  const woStatusRows = (woStatusRes.data ?? []) as StatusRow[];
  const assetStatusRows = (assetStatusRes.data ?? []) as StatusRow[];

  const woStatusCounts = woStatusRows.reduce((acc, row) => {
    const key = row.status ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assetStatusCounts = assetStatusRows.reduce((acc, row) => {
    const key = row.status ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentWOs = (recentWOsRes.data ?? []) as WorkOrderRow[];
  const upcomingPMs = (upcomingPMRes.data ?? []) as PreventiveRow[];
  const criticalAssets = (criticalAssetsRes.data ?? []) as AssetRow[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Operations Overview</h1>
          <p className="mt-2 text-slate-600">Welcome back! Here&apos;s your maintenance snapshot</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/work-orders"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            New Work Order
          </Link>
          <Link
            href="/dashboard/assets"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Add Asset
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Assets" value={totalAssets} icon="🏭" trend="+2" trendUp />
        <KpiCard label="Open Work Orders" value={openWOs} icon="📋" accent="red" trend={openWOs > 10 ? "High" : "Normal"} />
        <KpiCard
          label="PM Compliance"
          value={`${pmComplianceRate}%`}
          icon="✓"
          accent={pmComplianceRate >= 85 ? "green" : "yellow"}
          trend={pmComplianceRate >= 85 ? "Excellent" : "Review"}
        />
        <KpiCard
          label="Asset Uptime"
          value={`${assetUptime}%`}
          icon="🔋"
          accent={assetUptime >= 95 ? "green" : "yellow"}
          trend={assetUptime >= 95 ? "Optimal" : "Monitor"}
        />
      </div>

      {/* Alerts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {overduePMs > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-900">{overduePMs} Overdue PM Schedules</p>
                <p className="mt-1 text-sm text-red-700">Generate work orders for preventive maintenance tasks</p>
                <Link href="/dashboard/preventive" className="mt-2 inline-block text-sm font-semibold text-red-600 hover:text-red-700">
                  Review PM Schedule →
                </Link>
              </div>
            </div>
          </div>
        )}

        {lowInventoryCount > 0 && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">{lowInventoryCount} Items Low in Stock</p>
                <p className="mt-1 text-sm text-yellow-700">Review inventory and place orders to prevent stockouts</p>
                <Link href="/dashboard/inventory" className="mt-2 inline-block text-sm font-semibold text-yellow-600 hover:text-yellow-700">
                  Check Inventory →
                </Link>
              </div>
            </div>
          </div>
        )}

        {criticalAssets.length > 0 && (
          <div className="rounded-xl border border-orange-300 bg-orange-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔧</span>
              <div className="flex-1">
                <p className="font-semibold text-orange-900">{criticalAssets.length} Assets Under Maintenance</p>
                <p className="mt-1 text-sm text-orange-700">Monitor critical asset repairs and maintenance status</p>
                <Link href="/dashboard/assets" className="mt-2 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
                  View Assets →
                </Link>
              </div>
            </div>
          </div>
        )}

        {inProgressWOs > 0 && (
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">{inProgressWOs} In Progress</p>
                <p className="mt-1 text-sm text-blue-700">Track active work orders and team progress</p>
                <Link href="/dashboard/work-orders" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View Work Orders →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Work Order Status & Upcoming PM - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> Work Order Distribution
            </h3>
            <div className="mt-5 space-y-4">
              {[
                { status: "open", label: "Open", count: woStatusCounts.open ?? 0, color: "bg-red-500" },
                { status: "assigned", label: "Assigned", count: woStatusCounts.assigned ?? 0, color: "bg-blue-500" },
                { status: "in_progress", label: "In Progress", count: woStatusCounts.in_progress ?? 0, color: "bg-amber-500" },
                { status: "completed", label: "Completed", count: woStatusCounts.completed ?? 0, color: "bg-green-500" },
              ].map((item) => {
                const total = totalWOs || 1;
                const percent = calculateProgressPercent(item.count, total);
                return (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{item.count}</span>
                        <span className="text-xs text-slate-500">({percent}%)</span>
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${item.color} transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming PM Schedule */}
          {upcomingPMs.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📅</span> Upcoming Maintenance
              </h3>
              <div className="mt-4 space-y-3">
                {upcomingPMs.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{pm.title}</p>
                      <p className="text-xs text-slate-500">Due {formatDate(pm.next_due_date)}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">Soon</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/preventive" className="mt-4 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View All Schedules →
              </Link>
            </div>
          )}
        </div>

        {/* Asset Status & Critical Assets - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Asset Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏭</span> Asset Status
            </h3>
            <div className="mt-5 space-y-3">
              {[
                { status: "active", label: "Active", icon: "✅", color: "text-green-600" },
                { status: "inactive", label: "Inactive", icon: "⏸️", color: "text-gray-600" },
                { status: "under_maintenance", label: "Maintenance", icon: "🔧", color: "text-orange-600" },
                { status: "retired", label: "Retired", icon: "🗑️", color: "text-slate-400" },
              ].map((item) => {
                const count = assetStatusCounts[item.status] ?? 0;
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className={`text-sm font-medium text-slate-700 flex items-center gap-2`}>
                      <span className={item.color}>{item.icon}</span> {item.label}
                    </span>
                    <span className="text-lg font-black text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Assets */}
          {criticalAssets.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                <span>⚠️</span> Under Maintenance
              </h3>
              <div className="mt-4 space-y-2">
                {criticalAssets.map((asset) => (
                  <div key={asset.id} className="text-sm text-orange-800 p-2 bg-orange-100 rounded">
                    {asset.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Work Orders */}
      {recentWOs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Recent work orders</h3>
                <p className="mt-1 text-xs text-slate-500">Latest maintenance tasks created in your organization.</p>
              </div>
              <Link href="/dashboard/work-orders" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentWOs.map((wo) => (
                <tr key={wo.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <Link href={`/dashboard/work-orders/${wo.id}`} className="hover:text-indigo-600">
                      {wo.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityColor(wo.priority)}`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusColor(wo.status)}`}>
                      {wo.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">{formatDate(wo.due_date ?? "")}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{formatDateRelative(wo.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: "red" | "green" | "yellow";
  trend?: string;
  trendUp?: boolean;
}) {
  const accentBg: Record<string, string> = {
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };

  const trendColor = trendUp ? "text-green-600" : "text-slate-600";

  return (
    <div className={`rounded-xl border p-5 ${accentBg[accent || ""] || "bg-indigo-50 border-indigo-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          {trend && <p className={`mt-2 text-xs font-semibold ${trendColor}`}>{trend}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
