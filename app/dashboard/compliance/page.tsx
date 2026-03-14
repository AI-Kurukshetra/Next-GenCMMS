import Link from "next/link";
import {
  createComplianceRecordAction,
  deleteComplianceRecordAction,
} from "@/app/dashboard/compliance/actions";
import { FilterForm } from "@/components/filter-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type ComplianceRecord = {
  id: string;
  asset_id: string;
  inspection_type: string;
  status: string;
  due_date: string;
  completed_date: string | null;
  notes: string | null;
  assets:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

export default async function CompliancePage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const statusFilter = (searchParams?.status ?? "").trim();

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
  const complianceRecords = (records ?? []) as ComplianceRecord[];

  // Calculate stats
  const total = complianceRecords.length;
  const pending = complianceRecords.filter((r) => r.status === "pending").length;
  const passed = complianceRecords.filter((r) => r.status === "passed").length;
  const failed = complianceRecords.filter((r) => r.status === "failed").length;
  const overdue = complianceRecords.filter((r) => r.status === "overdue").length;

  function getAssetName(record: ComplianceRecord) {
    if (Array.isArray(record.assets)) {
      return record.assets[0]?.name ?? null;
    }

    return record.assets?.name ?? null;
  }

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
      <FilterForm
        fields={[
          {
            name: 'status',
            label: 'All statuses',
            type: 'select',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'passed', label: 'Passed' },
              { value: 'failed', label: 'Failed' },
              { value: 'overdue', label: 'Overdue' },
            ],
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={createComplianceRecordAction}
          resetOnSuccess
          successMessage="Compliance record created successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">Create Record</h3>
          <select
            name="asset_id"
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
            required
            placeholder="Inspection type *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input name="due_date" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Notes" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Create
          </FormSubmitButton>
        </ServerActionForm>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Compliance records</h4>
                <p className="mt-1 text-xs text-slate-500">Safety inspections and compliance tracking</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {complianceRecords.length} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Inspection</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complianceRecords.length ? (
                complianceRecords.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-medium text-slate-900">{getAssetName(record) || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{record.inspection_type}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(record.due_date)}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/compliance/${record.id}`} className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200">
                          View
                        </Link>
                        <form action={deleteComplianceRecordAction}>
                          <input type="hidden" name="id" value={record.id} />
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
