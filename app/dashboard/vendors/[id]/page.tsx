import { redirect } from "next/navigation";
import { deleteVendorAction, updateVendorAction } from "@/app/dashboard/vendors/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VendorDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id,name,contact_name,email,phone,services,performance_score")
    .eq("id", params.id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!vendor) {
    redirect("/dashboard/vendors");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Vendor Details</h2>
        <p className="mt-2 text-slate-600">Update vendor details from this screen.</p>
      </div>

      <div className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <ServerActionForm
          action={updateVendorAction}
          successMessage="Vendor updated successfully."
          className="space-y-3"
        >
          <input type="hidden" name="id" value={vendor.id} />
          <input
            name="name"
            required
            defaultValue={vendor.name}
            placeholder="Vendor name *"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="contact_name"
            defaultValue={vendor.contact_name ?? ""}
            placeholder="Contact name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="services"
            defaultValue={vendor.services ?? ""}
            placeholder="Services offered"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            defaultValue={vendor.email ?? ""}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="phone"
            defaultValue={vendor.phone ?? ""}
            placeholder="Phone"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="performance_score"
            type="number"
            step="0.1"
            min="0"
            max="5"
            defaultValue={vendor.performance_score ?? ""}
            placeholder="Rating (0-5)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            type="submit"
            pendingText="Updating..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Update Vendor
          </FormSubmitButton>
        </ServerActionForm>

        <form action={deleteVendorAction}>
          <input type="hidden" name="id" value={vendor.id} />
          <FormSubmitButton
            type="submit"
            pendingText="Deleting..."
            className="w-full rounded-lg bg-rose-600 py-2 font-semibold text-white hover:bg-rose-700"
          >
            Delete Vendor
          </FormSubmitButton>
        </form>
      </div>
    </section>
  );
}
