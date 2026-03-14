import Link from "next/link";
import { createAssetAction, deleteAssetAction } from "@/app/dashboard/assets/actions";
import { CSVExportButton } from "@/components/csv-export-button";
import { FilterForm } from "@/components/filter-form";
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
  locations:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
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
      .select("id,name,model,serial_number,manufacturer,status,location_id,created_at,locations(name)")
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

  function getStatusClasses(assetStatus: string) {
    switch (assetStatus) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      case "inactive":
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
      case "under_maintenance":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
      case "retired":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  }

  function getLocationName(asset: AssetRecord) {
    if (Array.isArray(asset.locations)) {
      return asset.locations[0]?.name ?? null;
    }

    return asset.locations?.name ?? null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Asset Registry</h2>
      <FilterForm
        fields={[
          {
            name: 'q',
            label: 'Search',
            type: 'text',
            placeholder: 'Search name/model/serial',
          },
          {
            name: 'status',
            label: 'All statuses',
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'under_maintenance', label: 'Under Maintenance' },
              { value: 'retired', label: 'Retired' },
            ],
          },
          {
            name: 'location_id',
            label: 'All locations',
            type: 'select',
            options: locations?.map((loc) => ({ value: loc.id, label: loc.name })) || [],
          },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <ServerActionForm
            action={createAssetAction}
            resetOnSuccess
            successMessage="Asset created successfully."
            className="rounded-xl border border-slate-200 p-4"
            encType="multipart/form-data"
          >
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
              <FormSubmitButton
                type="submit"
                pendingText="Saving..."
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save Asset
              </FormSubmitButton>
            </div>
          </ServerActionForm>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Asset List</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Assets ({assets?.length || 0})</h3>
            </div>
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Registered equipment</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    View image, status, serial details, and open the full asset profile.
                  </p>
                </div>
                <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {assetRows.length} total
                </div>
              </div>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assetRows.length ? (
                  assetRows.map((asset) => (
                    <tr key={asset.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div className="flex min-w-16 justify-center">
                          {latestImageByAsset[asset.id] ? (
                            <img
                              src={latestImageByAsset[asset.id].downloadUrl}
                              alt={asset.name}
                              className="h-16 w-16 rounded-xl border border-slate-200 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/assets/${asset.id}`}
                          className="block font-semibold text-slate-900 transition hover:text-indigo-600"
                        >
                          {asset.name}
                        </Link>
                        <div className="mt-1 space-y-1 text-xs text-slate-500">
                          <p>{asset.manufacturer || "Manufacturer not set"}</p>
                          <p>{getLocationName(asset) || "Location not assigned"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700">{asset.model ?? "-"}</p>
                          <p className="text-xs text-slate-500">
                            Added {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700 ring-1 ring-slate-200">
                          {asset.serial_number ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(asset.status)}`}
                        >
                          {asset.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                          >
                            View
                          </Link>
                          <form action={deleteAssetAction}>
                            <input type="hidden" name="id" value={asset.id} />
                            <FormSubmitButton
                              type="submit"
                              pendingText="Deleting..."
                              className="inline-flex items-center rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
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
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                          🏭
                        </div>
                        <h4 className="mt-4 text-sm font-semibold text-slate-900">No assets yet</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Create your first asset from the form on the left to start building the registry.
                        </p>
                      </div>
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
