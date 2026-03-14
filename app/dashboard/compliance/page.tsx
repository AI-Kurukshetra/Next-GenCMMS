import {
  createComplianceRecordAction,
  deleteComplianceRecordAction,
  updateComplianceRecordAction,
  updateComplianceStatusAction,
} from "@/app/dashboard/compliance/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function CompliancePage({
  searchParams,
}: {
  searchParams?: { status?: string; edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const statusFilter = (searchParams?.status ?? "").trim();
  const editId = (searchParams?.edit_id ?? "").trim();

  let query = supabase
    .from("compliance_records")
    .select(`
      id,
      asset_id,
      inspection_type,
      status,
      due_date,
      completed_date,
      notes,
      assets(id,name)
    `)
    .eq("organization_id", profile.organization_id)
    .order("due_date", { ascending: true })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const [{ data: records }, { data: assets }] = await Promise.all([
    query,
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);

  // Calculate stats
  const total = records?.length || 0;
  const pending = records?.filter((r: any) => r.status === "pending").length || 0;
  const passed = records?.filter((r: any) => r.status === "passed").length || 0;
  const failed = records?.filter((r: any) => r.status === "failed").length || 0;
  const overdue = records?.filter((r: any) => r.status === "overdue").length || 0;
  const editingRecord = records?.find((record: any) => record.id === editId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Safety & Compliance</h2>
        <p className="mt-2 text-slate-600">Manage inspections and compliance records</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-2xl font-black text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-600">Pending</p>
          <p className="text-2xl font-black text-blue-900">{pending}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">Passed</p>
          <p className="text-2xl font-black text-green-900">{passed}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Failed</p>
          <p className="text-2xl font-black text-red-900">{failed}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-600">Overdue</p>
          <p className="text-2xl font-black text-orange-900">{overdue}</p>
        </div>
      </div>

      {/* Filter */}
      <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-slate-300 px-3 py-2 text-sm col-span-3">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="overdue">Overdue</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={editingRecord ? updateComplianceRecordAction : createComplianceRecordAction} className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit">
          <h3 className="text-base font-bold text-slate-900">{editingRecord ? "Edit Record" : "Create Record"}</h3>
          {editingRecord && <input type="hidden" name="id" value={editingRecord.id} />}
          <select
            name="asset_id"
            defaultValue={editingRecord?.asset_id ?? ""}
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
          <input
            name="inspection_type"
            defaultValue={editingRecord?.inspection_type ?? ""}
            required
            placeholder="Inspection type *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input name="due_date" type="date" defaultValue={editingRecord?.due_date ?? ""} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="notes" defaultValue={editingRecord?.notes ?? ""} placeholder="Notes" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2 hover:bg-indigo-700">
            {editingRecord ? "Update" : "Create"}
          </button>
          {editingRecord && (
            <a href="/dashboard/compliance" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
              Cancel Edit
            </a>
          )}
        </form>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Asset</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Inspection</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Due Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records?.length ? (
                records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{record.assets?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{record.inspection_type}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(record.due_date)}</td>
                    <td className="px-4 py-3">
                      <form action={updateComplianceStatusAction} className="flex gap-1">
                        <input type="hidden" name="id" value={record.id} />
                        <select name="status" defaultValue={record.status} required className="rounded text-xs px-2 py-1 border border-slate-300">
                          <option value="pending">Pending</option>
                          <option value="passed">Passed</option>
                          <option value="failed">Failed</option>
                          <option value="overdue">Overdue</option>
                        </select>
                        <button type="submit" className="text-xs font-semibold text-slate-700 px-2 py-1 bg-slate-200 rounded hover:bg-slate-300">
                          Status
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <form action={deleteComplianceRecordAction}>
                          <input type="hidden" name="id" value={record.id} />
                          <button type="submit" className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No compliance records yet
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
