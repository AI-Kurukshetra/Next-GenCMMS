import { redirect } from "next/navigation";
import { updateInventoryPartAction } from "@/app/dashboard/inventory/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

type DocumentRecord = {
  id: string;
  bucket: string;
  entity_id: string;
  path: string;
  mime_type: string | null;
  created_at: string | null;
};

export default async function InventoryDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: part }, { data: locations }, { data: docs }] = await Promise.all([
    supabase
      .from("inventory_parts")
      .select("id,name,location_id,sku,quantity_on_hand,reorder_threshold,unit_cost")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("locations")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
    supabase
      .from("documents")
      .select("id,bucket,entity_id,path,mime_type,created_at")
      .eq("organization_id", profile.organization_id)
      .eq("entity_type", "inventory")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!part) {
    redirect("/dashboard/inventory");
  }

  let imageUrl: string | null = null;
  const latestDoc = (docs?.[0] ?? null) as DocumentRecord | null;
  if (latestDoc && latestDoc.mime_type?.startsWith("image/")) {
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
    const { data } = await storageClient.storage.from(latestDoc.bucket).createSignedUrl(latestDoc.path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Inventory Part Details</h2>
        <p className="mt-2 text-slate-600">Update stock details and part image.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-900">Current Image</h3>
          <div className="mt-4">
            {imageUrl ? (
              <img src={imageUrl} alt={part.name} className="h-48 w-full rounded-xl border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500">
                No image uploaded
              </div>
            )}
          </div>
        </div>

        <ServerActionForm
          action={updateInventoryPartAction}
          successMessage="Part updated successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h3 className="text-base font-semibold text-slate-900">Edit Part</h3>
          <input type="hidden" name="id" value={part.id} />
          <input
            name="name"
            required
            defaultValue={part.name}
            placeholder="Part name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="sku"
            defaultValue={part.sku ?? ""}
            placeholder="SKU"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="location_id"
            defaultValue={part.location_id}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select location</option>
            {locations?.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              name="quantity_on_hand"
              defaultValue={part.quantity_on_hand}
              placeholder="Qty"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              name="reorder_threshold"
              defaultValue={part.reorder_threshold}
              placeholder="Reorder"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            name="unit_cost"
            defaultValue={part.unit_cost ?? ""}
            placeholder="Unit cost"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Replace part image (optional)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
            />
          </div>
          <FormSubmitButton
            type="submit"
            pendingText="Updating..."
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Update Part
          </FormSubmitButton>
        </ServerActionForm>
      </div>
    </section>
  );
}
