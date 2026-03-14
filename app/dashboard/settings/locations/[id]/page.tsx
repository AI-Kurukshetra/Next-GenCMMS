import { redirect } from "next/navigation";
import { updateLocationAction } from "@/app/dashboard/settings/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LocationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id,name,code")
    .eq("id", params.id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!location) {
    redirect("/dashboard/settings");
  }

  return (
    <section className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Location Details</h2>
        <p className="mt-2 text-slate-600">Update location information.</p>
      </div>

      <ServerActionForm
        action={updateLocationAction}
        successMessage="Location updated successfully."
        className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
      >
        <input type="hidden" name="id" value={location.id} />
        <input
          name="name"
          required
          defaultValue={location.name}
          placeholder="Location name *"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="code"
          defaultValue={location.code ?? ""}
          placeholder="Location code"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <FormSubmitButton
          type="submit"
          pendingText="Updating..."
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Update Location
        </FormSubmitButton>
      </ServerActionForm>
    </section>
  );
}
