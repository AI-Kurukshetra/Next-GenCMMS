import {
  createInventoryPartAction,
  deleteInventoryPartAction,
  updateInventoryPartAction,
} from "@/app/dashboard/inventory/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: { edit_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: parts }, { data: locations }] = await Promise.all([
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
  ]);
  const editId = (searchParams?.edit_id ?? "").trim();
  const editingPart = parts?.find((part) => part.id === editId);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={editingPart ? updateInventoryPartAction : createInventoryPartAction} className="rounded-xl border border-slate-200 p-4">
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
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              {editingPart ? "Update Part" : "Save Part"}
            </button>
            {editingPart && (
              <a href="/dashboard/inventory" className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900">
                Cancel Edit
              </a>
            )}
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Part</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Reorder</th>
                <th className="px-3 py-2">Unit Cost</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts?.length ? (
                parts.map((part) => (
                  <tr key={part.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{part.name}</td>
                    <td className="px-3 py-2 text-slate-700">{part.sku ?? "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{part.quantity_on_hand}</td>
                    <td className="px-3 py-2 text-slate-700">{part.reorder_threshold}</td>
                    <td className="px-3 py-2 text-slate-700">{part.unit_cost ?? "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <form action={deleteInventoryPartAction}>
                          <input type="hidden" name="id" value={part.id} />
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
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">No parts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
