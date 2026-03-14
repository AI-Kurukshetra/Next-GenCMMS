import { redirect } from "next/navigation";
import { updateComplianceRecordAction, updateComplianceStatusAction } from "@/app/dashboard/compliance/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ComplianceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: record }, { data: assets }] = await Promise.all([
    supabase
      .from("compliance_records")
      .select("id,asset_id,inspection_type,status,due_date,notes")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("assets")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);

  if (!record) {
    redirect("/dashboard/compliance");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Compliance Record Details</h2>
        <p className="mt-2 text-slate-600">Update inspection details and status.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerActionForm
          action={updateComplianceRecordAction}
          successMessage="Compliance record updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-semibold text-slate-900">Edit Record</h3>
          <input type="hidden" name="id" value={record.id} />
          <select
            name="asset_id"
            defaultValue={record.asset_id}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select asset *</option>
            {assets?.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
          <input
            name="inspection_type"
            defaultValue={record.inspection_type}
            required
            placeholder="Inspection type *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="due_date"
            type="date"
            defaultValue={record.due_date}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="notes"
            defaultValue={record.notes ?? ""}
            placeholder="Notes"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Updating..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Update Record
          </FormSubmitButton>
        </ServerActionForm>

        <ServerActionForm
          action={updateComplianceStatusAction}
          successMessage="Compliance status updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-semibold text-slate-900">Update Status</h3>
          <input type="hidden" name="id" value={record.id} />
          <select
            name="status"
            defaultValue={record.status}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="overdue">Overdue</option>
          </select>
          <FormSubmitButton
            type="submit"
            pendingText="Updating..."
            className="w-full rounded-lg bg-slate-900 py-2 font-semibold text-white hover:bg-slate-700"
          >
            Save Status
          </FormSubmitButton>
        </ServerActionForm>
      </div>
    </section>
  );
}
