import Link from "next/link";
import { createAssetAction, deleteAssetAction, uploadAssetImageAction } from "@/app/dashboard/assets/actions";
import { CSVExportButton } from "@/components/csv-export-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

type AssetRecord = {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  status: string;
  location_id: string;
  created_at: string | null;
};

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
      .select("id,name,model,serial_number,manufacturer,status,location_id,created_at")
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

  const [
    { data: assets },
    { data: locations },
    { data: documents },
  ] = await Promise.all([
    assetsQuery,
    supabase
      .from("locations")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
    supabase
      .from("documents")
      .select("id,bucket,entity_id,path,mime_type,created_at")
      .eq("organization_id", profile.organization_id)
      .eq("entity_type", "asset")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const documentRecords = (documents ?? []) as DocumentRecord[];
  const signedDocuments = await Promise.all(
    documentRecords.map(async (doc) => {
      const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.path, 60);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        ...doc,
        downloadUrl: data.signedUrl,
      };
    })
  );
  const assetDocuments: DocumentWithUrl[] = signedDocuments.filter(
    (doc): doc is DocumentWithUrl => Boolean(doc)
  );
  const latestImageByAsset: Record<string, DocumentWithUrl> = {};
  assetDocuments.forEach((doc) => {
    if (!latestImageByAsset[doc.entity_id]) {
      latestImageByAsset[doc.entity_id] = doc;
    }
  });
  const assetRows = (assets ?? []) as AssetRecord[];

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
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <form action={createAssetAction} className="rounded-xl border border-slate-200 p-4" encType="multipart/form-data">
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
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Asset image (required)
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Save Asset
              </button>
            </div>
          </form>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Assets ({assets?.length || 0})</h3>
            {assets && assets.length > 0 && (
              <CSVExportButton
                data={assets.map((asset) => ({
                  name: asset.name,
                  model: asset.model || "-",
                  serial_number: asset.serial_number || "-",
                  status: asset.status.replace("_", " "),
                }))}
                filename="assets"
                columns={["name", "model", "serial_number", "status"]}
              />
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Image</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assetRows.length ? (
                  assetRows.map((asset) => (
                    <tr key={asset.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="flex min-w-28 flex-col gap-2">
                          {latestImageByAsset[asset.id] ? (
                            <img
                              src={latestImageByAsset[asset.id].downloadUrl}
                              alt={asset.name}
                              className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              No image
                            </div>
                          )}
                          <form action={uploadAssetImageAction} encType="multipart/form-data" className="space-y-1">
                            <input type="hidden" name="asset_id" value={asset.id} />
                            <input
                              type="file"
                              name="image"
                              accept="image/*"
                              required
                              className="block w-full text-[11px] text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-slate-700"
                            />
                            <button type="submit" className="w-full rounded bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700">
                              Upload
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-indigo-600 hover:underline">
                        <Link href={`/dashboard/assets/${asset.id}`}>{asset.name}</Link>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{asset.model ?? "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{asset.serial_number ?? "-"}</td>
                      <td className="px-3 py-2 capitalize text-slate-700">{asset.status.replaceAll("_", " ")}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                          >
                            View
                          </Link>
                          <form action={deleteAssetAction}>
                            <input type="hidden" name="id" value={asset.id} />
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
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      No assets yet.
                    </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
