import Link from "next/link";
import {
  addPartUsageAction,
  closeWorkOrderAction,
  logTimeAction,
  updateWorkOrderAction,
  updateWorkOrderStatusAction,
} from "@/app/dashboard/work-orders/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateRelative, getPriorityColor, getStatusColor } from "@/lib/utils";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [workOrderRes, techniciansRes, timeLogsRes, partsUsageRes, inventoryRes] =
    await Promise.all([
      supabase
        .from("work_orders")
        .select("*")
        .eq("id", params.id)
        .eq("organization_id", profile.organization_id)
        .single(),
      supabase
        .from("profiles")
        .select("id,full_name")
        .eq("organization_id", profile.organization_id)
        .eq("role", "technician"),
      supabase
        .from("work_order_time_logs")
        .select("id,minutes_spent,labor_cost,logged_at,technician_id")
        .eq("organization_id", profile.organization_id)
        .eq("work_order_id", params.id)
        .order("logged_at", { ascending: false }),
      supabase
        .from("work_order_parts")
        .select("id,quantity_used,unit_cost,part_id,created_at")
        .eq("organization_id", profile.organization_id)
        .eq("work_order_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_parts")
        .select("id,name,quantity_on_hand")
        .eq("organization_id", profile.organization_id)
        .order("name"),
    ]);

  const workOrder = workOrderRes.data;

  if (!workOrder) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Work order not found</h2>
        <Link href="/dashboard/work-orders" className="text-sm font-semibold text-indigo-600 hover:underline">
          Back to Work Orders
        </Link>
      </section>
    );
  }

  const technicians = techniciansRes.data ?? [];
  const technicianMap = new Map(technicians.map((t) => [t.id, t.full_name || "Technician"]));

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Work Order</p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">{workOrder.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(workOrder.status)}`}>
              {workOrder.status.replace("_", " ")}
            </span>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(workOrder.priority)}`}>
              {workOrder.priority}
            </span>
          </div>
        </div>
        <Link href="/dashboard/work-orders" className="text-sm font-semibold text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerActionForm
          action={updateWorkOrderAction}
          successMessage="Work order updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-slate-900">Edit Work Order</h3>
          <input type="hidden" name="id" value={workOrder.id} />
          <input type="hidden" name="location_id" value={workOrder.location_id} />
          <input type="hidden" name="asset_id" value={workOrder.asset_id} />
          <input name="title" defaultValue={workOrder.title} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea
            name="description"
            defaultValue={workOrder.description || ""}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select name="priority" defaultValue={workOrder.priority} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              name="maintenance_type"
              defaultValue={workOrder.maintenance_type}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          <select name="assigned_to" defaultValue={workOrder.assigned_to ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || "Technician"}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="due_date"
            defaultValue={workOrder.due_date ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Save Changes
          </FormSubmitButton>
        </ServerActionForm>

        <div className="space-y-4">
          <form action={updateWorkOrderStatusAction} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">Status</h3>
            <div className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={workOrder.id} />
              <select name="status" defaultValue={workOrder.status} required className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <FormSubmitButton
                type="submit"
                pendingText="Updating..."
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Update
              </FormSubmitButton>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Created {formatDateRelative(workOrder.created_at)} | Due {formatDate(workOrder.due_date || "")}
            </p>
          </form>

          <ServerActionForm
            action={closeWorkOrderAction}
            resetOnSuccess
            successMessage="Work order closed successfully."
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900">Close Work Order</h3>
            <input type="hidden" name="id" value={workOrder.id} />
            <textarea
              name="closure_notes"
              placeholder="Closure notes (required)"
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <FormSubmitButton
              type="submit"
              pendingText="Closing..."
              className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Mark Completed
            </FormSubmitButton>
          </ServerActionForm>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerActionForm
          action={logTimeAction}
          resetOnSuccess
          successMessage="Time log added successfully."
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-slate-900">Log Time</h3>
          <input type="hidden" name="work_order_id" value={workOrder.id} />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="minutes_spent"
              type="number"
              min={1}
              required
              placeholder="Minutes"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="labor_cost"
              type="number"
              min={0}
              step="0.01"
              placeholder="Labor cost"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Time Log
          </FormSubmitButton>

          <div className="mt-2 space-y-2">
            {(timeLogsRes.data ?? []).map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-800">{log.minutes_spent} mins</p>
                <p className="text-xs text-slate-600">
                  {technicianMap.get(log.technician_id) || "Technician"} · {formatDateRelative(log.logged_at)}
                </p>
              </div>
            ))}
          </div>
        </ServerActionForm>

        <ServerActionForm
          action={addPartUsageAction}
          resetOnSuccess
          successMessage="Part usage added successfully."
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-slate-900">Part Usage</h3>
          <input type="hidden" name="work_order_id" value={workOrder.id} />
          <select name="part_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select part</option>
            {(inventoryRes.data ?? []).map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} (Stock: {part.quantity_on_hand})
              </option>
            ))}
          </select>
          <input
            name="quantity_used"
            type="number"
            min={0.01}
            step="0.01"
            required
            placeholder="Quantity used"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Part Usage
          </FormSubmitButton>

          <div className="mt-2 space-y-2">
            {(partsUsageRes.data ?? []).map((item) => {
              const part = (inventoryRes.data ?? []).find((p) => p.id === item.part_id);
              return (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">{part?.name || "Part"}</p>
                  <p className="text-xs text-slate-600">
                    Qty {item.quantity_used} · {formatDateRelative(item.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </ServerActionForm>
      </div>
    </section>
  );
}
