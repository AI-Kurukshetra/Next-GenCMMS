import Link from "next/link";
import { createVendorAction, deleteVendorAction, updateVendorAction } from "@/app/dashboard/vendors/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams?: { edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id,name,contact_name,email,phone,services,performance_score")
    .eq("organization_id", profile.organization_id)
    .order("name");
  const editId = (searchParams?.edit_id ?? "").trim();
  const editingVendor = vendors?.find((vendor) => vendor.id === editId);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Vendors</h2>
        <p className="mt-2 text-slate-600">Manage suppliers and service providers</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={editingVendor ? updateVendorAction : createVendorAction}
          resetOnSuccess={!editingVendor}
          successMessage={editingVendor ? "Vendor updated successfully." : "Vendor added successfully."}
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">{editingVendor ? "Edit Vendor" : "Add Vendor"}</h3>
          {editingVendor && <input type="hidden" name="id" value={editingVendor.id} />}
          <input name="name" required defaultValue={editingVendor?.name ?? ""} placeholder="Vendor name *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="contact_name" defaultValue={editingVendor?.contact_name ?? ""} placeholder="Contact name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="services" defaultValue={editingVendor?.services ?? ""} placeholder="Services offered" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" defaultValue={editingVendor?.email ?? ""} placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="phone" defaultValue={editingVendor?.phone ?? ""} placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="performance_score" type="number" step="0.1" min="0" max="5" defaultValue={editingVendor?.performance_score ?? ""} placeholder="Rating (0-5)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <FormSubmitButton
            type="submit"
            pendingText={editingVendor ? "Updating..." : "Saving..."}
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            {editingVendor ? "Update Vendor" : "Add Vendor"}
          </FormSubmitButton>
          {editingVendor && (
            <Link href="/dashboard/vendors" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
              Cancel Edit
            </Link>
          )}
        </ServerActionForm>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Vendors</h4>
                <p className="mt-1 text-xs text-slate-500">Manage suppliers and service providers</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {vendors?.length || 0} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors?.length ? vendors.map((v) => (
                <tr key={v.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">{v.name}</td>
                  <td className="px-4 py-4 text-slate-600">{v.services || "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{v.contact_name || "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{v.email || "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{v.phone || "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{v.performance_score ?? "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <form action={deleteVendorAction}>
                        <input type="hidden" name="id" value={v.id} />
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
              )) : <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No vendors yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
