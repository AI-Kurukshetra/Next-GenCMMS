import { createAssetAction } from "@/app/dashboard/assets/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; location_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const locationId = (searchParams?.location_id ?? "").trim();

  const assetsQuery = supabase
      .from("assets")
      .select("id,name,model,serial_number,status,created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(100);

  if (status) {
    assetsQuery.eq("status", status);
  }
  if (locationId) {
    assetsQuery.eq("location_id", locationId);
  }
  if (q) {
    assetsQuery.or(`name.ilike.%${q}%,model.ilike.%${q}%,serial_number.ilike.%${q}%`);
  }

  const [{ data: assets }, { data: locations }] = await Promise.all([
    assetsQuery,
    supabase
      .from("locations")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
  ]);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Asset Registry</h2>
      <form method="get" className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name/model/serial"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        <select name="location_id" defaultValue={locationId} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All locations</option>
          {locations?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Apply Filters
        </button>
      </form>
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={createAssetAction} className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">Create Asset</h3>
          <div className="mt-4 space-y-3">
            <input name="name" required placeholder="Asset name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="model" placeholder="Model" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="serial_number" placeholder="Serial number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="manufacturer" placeholder="Manufacturer" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select name="status" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <select name="location_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select location</option>
              {locations?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Save Asset
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets?.length ? (
                assets.map((asset) => (
                  <tr key={asset.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{asset.name}</td>
                    <td className="px-3 py-2 text-slate-700">{asset.model ?? "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{asset.serial_number ?? "-"}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{asset.status.replaceAll("_", " ")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    No assets yet.
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
