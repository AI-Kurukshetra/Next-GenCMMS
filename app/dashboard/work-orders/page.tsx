import Link from "next/link";
import {
  createWorkOrderAction,
  deleteWorkOrderAction,
  updateWorkOrderStatusAction,
} from "@/app/dashboard/work-orders/actions";
import { FilterForm } from "@/components/filter-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
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
      <FilterForm
        fields={[
          {
            name: 'q',
            label: 'Search',
            type: 'text',
            placeholder: 'Search by title',
          },
          {
            name: 'status',
            label: 'All statuses',
            type: 'select',
            options: [
              { value: 'open', label: 'Open' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
          },
          {
            name: 'priority',
            label: 'All priorities',
            type: 'select',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ],
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={createWorkOrderAction}
          resetOnSuccess
          successMessage="Work order created successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
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
          <FormSubmitButton
            type="submit"
            pendingText="Creating..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Create
          </FormSubmitButton>
        </ServerActionForm>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Work orders</h4>
                <p className="mt-1 text-xs text-slate-500">Create, assign, and track maintenance tasks</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {workOrders?.length || 0} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {workOrders?.length ? workOrders.map((wo) => (
                <tr key={wo.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium"><Link href={`/dashboard/work-orders/${wo.id}`} className="text-indigo-600 hover:underline">{wo.title}</Link></td>
                  <td className="px-4 py-4 capitalize text-slate-600">{wo.maintenance_type}</td>
                  <td className="px-4 py-4"><span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${wo.priority === 'critical' ? 'bg-red-100 text-red-800' : wo.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'}`}>{wo.priority}</span></td>
                  <td className="px-4 py-4">
                    <form action={updateWorkOrderStatusAction} className="flex gap-1">
                      <input type="hidden" name="id" value={wo.id} />
                      <select name="status" defaultValue={wo.status} required className="rounded text-xs px-2 py-1 border border-slate-300">
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <FormSubmitButton
                        type="submit"
                        pendingText="Updating..."
                        className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Update
                      </FormSubmitButton>
                    </form>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(wo.due_date || "", "MMM d")}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <Link href={`/dashboard/work-orders/${wo.id}`} className="text-indigo-600 text-xs font-semibold hover:underline">View</Link>
                      <form action={deleteWorkOrderAction}>
                        <input type="hidden" name="id" value={wo.id} />
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
              )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No work orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
