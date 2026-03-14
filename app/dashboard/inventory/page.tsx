import {
  createInventoryPartAction,
  deleteInventoryPartAction,
  updateInventoryPartAction,
} from "@/app/dashboard/inventory/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type DocumentRecord = {
  id: string;
  bucket: string;
  entity_id: string;
  path: string;
  mime_type: string | null;
  created_at: string | null;
};

type DocumentWithUrl = DocumentRecord & {
  downloadUrl: string;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: { edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: parts }, { data: locations }, { data: documents }] = await Promise.all([
    supabase
      .from("inventory_parts")
      .select("id,name,location_id,sku,quantity_on_hand,reorder_threshold,unit_cost")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(50),
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
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const documentRecords = (documents ?? []) as DocumentRecord[];
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
  const signedDocuments = await Promise.all(
    documentRecords.map(async (doc) => {
      const { data, error } = await storageClient.storage.from(doc.bucket).createSignedUrl(doc.path, 3600);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        ...doc,
        downloadUrl: data.signedUrl,
      };
    })
  );

  const latestImageByPart: Record<string, DocumentWithUrl> = {};
  signedDocuments.forEach((doc) => {
    if (doc && doc.mime_type?.startsWith("image/")) {
      if (!latestImageByPart[doc.entity_id]) {
        latestImageByPart[doc.entity_id] = doc;
      }
    }
  });

  const editId = (searchParams?.edit_id ?? "").trim();
  const editingPart = parts?.find((part) => part.id === editId);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={editingPart ? updateInventoryPartAction : createInventoryPartAction}
          resetOnSuccess={!editingPart}
          successMessage={editingPart ? "Part updated successfully." : "Part saved successfully."}
          className="rounded-xl border border-slate-200 p-4"
        >
          <h3 className="text-base font-semibold text-slate-900">{editingPart ? "Edit Part" : "Add Part"}</h3>
          <div className="mt-4 space-y-3">
            {editingPart && <input type="hidden" name="id" value={editingPart.id} />}
            <input
              name="name"
              required
              defaultValue={editingPart?.name ?? ""}
              placeholder="Part name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input name="sku" defaultValue={editingPart?.sku ?? ""} placeholder="SKU" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select
              name="location_id"
              defaultValue={editingPart?.location_id ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select location</option>
              {locations?.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                name="quantity_on_hand"
                defaultValue={editingPart?.quantity_on_hand ?? 0}
                placeholder="Qty"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                name="reorder_threshold"
                defaultValue={editingPart?.reorder_threshold ?? 0}
                placeholder="Reorder"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              name="unit_cost"
              defaultValue={editingPart?.unit_cost ?? ""}
              placeholder="Unit cost"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                Part image (optional)
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
              pendingText={editingPart ? "Updating..." : "Saving..."}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {editingPart ? "Update Part" : "Save Part"}
            </FormSubmitButton>
            {editingPart && (
              <a href="/dashboard/inventory" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
                Cancel Edit
              </a>
            )}
          </div>
        </ServerActionForm>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Parts inventory</h4>
                <p className="mt-1 text-xs text-slate-500">Stock items and supplies tracking</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {parts?.length || 0} total
              </div>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Reorder</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts?.length ? (
                parts.map((part) => (
                  <tr key={part.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-4 py-4">
                      <div className="flex min-w-16 justify-center">
                        {latestImageByPart[part.id] ? (
                          <img
                            src={latestImageByPart[part.id].downloadUrl}
                            alt={part.name}
                            className="h-16 w-16 rounded-xl border border-slate-200 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">{part.name}</td>
                    <td className="px-4 py-4 text-slate-700">{part.sku ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-700">{part.quantity_on_hand}</td>
                    <td className="px-4 py-4 text-slate-700">{part.reorder_threshold}</td>
                    <td className="px-4 py-4 text-slate-700">{part.unit_cost ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <form action={deleteInventoryPartAction}>
                          <input type="hidden" name="id" value={part.id} />
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
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No parts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
