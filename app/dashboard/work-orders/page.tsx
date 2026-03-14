import Link from "next/link";
import {
  createWorkOrderAction,
  deleteWorkOrderAction,
  updateWorkOrderStatusAction,
} from "@/app/dashboard/work-orders/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; priority?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const priority = (searchParams?.priority ?? "").trim();

  const workOrdersQuery = supabase
    .from("work_orders")
    .select("id,title,status,priority,due_date,assigned_to,created_at,maintenance_type")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    workOrdersQuery.eq("status", status);
  }
  if (priority) {
    workOrdersQuery.eq("priority", priority);
  }
  if (q) {
    workOrdersQuery.ilike("title", `%${q}%`);
  }

  const [{ data: workOrders }, { data: assets }, { data: locations }, { data: technicians }] = await Promise.all([
    workOrdersQuery,
    supabase.from("assets").select("id,name").eq("organization_id", profile.organization_id).order("name"),
    supabase.from("locations").select("id,name").eq("organization_id", profile.organization_id).order("name"),
    supabase.from("profiles").select("id,full_name").eq("organization_id", profile.organization_id).eq("role", "technician"),
  ]);

  const statusOptions = ["open", "assigned", "in_progress", "completed", "cancelled"];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Work Orders</h2>
        <p className="mt-2 text-slate-600">Create, assign, and track maintenance tasks</p>
      </div>
      <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select name="priority" defaultValue={priority} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Apply Filters
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={createWorkOrderAction} className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit">
          <h3 className="text-base font-bold text-slate-900">Create Work Order</h3>
          <input name="title" required placeholder="Title *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Description" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="asset_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Asset *</option>
            {assets?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select name="location_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Location *</option>
            {locations?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select name="priority" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select name="maintenance_type" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          <select name="assigned_to" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {technicians?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <input type="date" name="due_date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2 hover:bg-indigo-700">Create</button>
        </form>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Due</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders?.length ? workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium"><Link href={`/dashboard/work-orders/${wo.id}`} className="text-indigo-600 hover:underline">{wo.title}</Link></td>
                  <td className="px-4 py-3 capitalize text-slate-600">{wo.maintenance_type}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${wo.priority === 'critical' ? 'bg-red-100 text-red-800' : wo.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'}`}>{wo.priority}</span></td>
                  <td className="px-4 py-3">
                    <form action={updateWorkOrderStatusAction} className="flex gap-1">
                      <input type="hidden" name="id" value={wo.id} />
                      <select name="status" defaultValue={wo.status} required className="rounded text-xs px-2 py-1 border border-slate-300">
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="submit" className="text-xs font-semibold text-slate-700 px-2 py-1 bg-slate-200 rounded hover:bg-slate-300">Update</button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(wo.due_date || "", "MMM d")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/work-orders/${wo.id}`} className="text-indigo-600 text-xs font-semibold hover:underline">View</Link>
                      <form action={deleteWorkOrderAction}>
                        <input type="hidden" name="id" value={wo.id} />
                        <button type="submit" className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No work orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
