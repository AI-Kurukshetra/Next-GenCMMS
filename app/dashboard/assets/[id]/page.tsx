import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateRelative } from "@/lib/utils";
import {
  deleteAssetImageAction,
  generateQRTokenAction,
  updateAssetAction,
  uploadAssetImageAction,
} from "@/app/dashboard/assets/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";

type AssetDocument = {
  id: string;
  bucket: string;
  path: string;
  mime_type: string | null;
  created_at: string | null;
  downloadUrl: string;
};

type MaintenanceHistoryRecord = {
  id: string;
  event_type: string;
  created_at: string | null;
  performer:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: asset }, { data: qrCode }, { data: history }, { data: locations }, { data: documents }] = await Promise.all([
    supabase
      .from("assets")
      .select("id,name,model,serial_number,manufacturer,status,purchase_date,warranty_expiry,specifications,location_id,locations(id,name)")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("asset_qr_codes")
      .select("id,qr_token")
      .eq("asset_id", params.id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("maintenance_history")
      .select("id,event_type,event_data,performed_by,created_at,performer:performed_by(full_name)")
      .eq("asset_id", params.id)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("locations")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true }),
    supabase
      .from("documents")
      .select("id,bucket,path,mime_type,created_at")
      .eq("organization_id", profile.organization_id)
      .eq("entity_type", "asset")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!asset) {
    return <div className="text-center py-12 text-slate-500">Asset not found</div>;
  }
  const assetRecord = asset;

  const qrCodeUrl = qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/scan/${qrCode.qr_token}`)}`
    : null;
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
  const signedDocuments = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data, error } = await storageClient.storage.from(doc.bucket).createSignedUrl(doc.path, 3600);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        id: doc.id,
        bucket: doc.bucket,
        path: doc.path,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
        downloadUrl: data.signedUrl,
      } satisfies AssetDocument;
    })
  );
  const assetImages = signedDocuments.filter((doc): doc is AssetDocument => Boolean(doc));
  const primaryImage = assetImages[0] ?? null;
  const historyRecords = (history ?? []) as MaintenanceHistoryRecord[];

  function getLocationName() {
    const relation = assetRecord.locations as
      | {
          name: string | null;
        }
      | {
          name: string | null;
        }[]
      | null;

    if (Array.isArray(relation)) {
      return relation[0]?.name ?? null;
    }

    return relation?.name ?? null;
  }

  function getPerformerName(record: MaintenanceHistoryRecord) {
    if (Array.isArray(record.performer)) {
      return record.performer[0]?.full_name ?? null;
    }

    return record.performer?.full_name ?? null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/assets" className="text-indigo-600 text-sm hover:underline mb-2 block">
            ← Back to Assets
          </Link>
          <h2 className="text-3xl font-black text-slate-900">{assetRecord.name}</h2>
          <p className="mt-1 text-slate-600">{assetRecord.model || "No model specified"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Status</p>
          <p className="text-2xl font-bold text-slate-900 capitalize">{assetRecord.status.replace("_", " ")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Serial Number</p>
                <p className="text-base font-semibold text-slate-900">{assetRecord.serial_number || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Manufacturer</p>
                <p className="text-base font-semibold text-slate-900">{assetRecord.manufacturer || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Location</p>
                <p className="text-base font-semibold text-slate-900">{getLocationName() || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Purchase Date</p>
                <p className="text-base font-semibold text-slate-900">{assetRecord.purchase_date ? formatDate(assetRecord.purchase_date) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Warranty Expiry</p>
                <p className="text-base font-semibold text-slate-900">{assetRecord.warranty_expiry ? formatDate(assetRecord.warranty_expiry) : "-"}</p>
              </div>
            </div>
          </div>

          <ServerActionForm
            action={updateAssetAction}
            successMessage="Asset updated successfully."
            className="rounded-xl border border-slate-200 bg-slate-50 p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Asset</h3>
            <input type="hidden" name="id" value={assetRecord.id} />
            <div className="grid grid-cols-2 gap-3">
              <input name="name" defaultValue={assetRecord.name} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="model" defaultValue={assetRecord.model ?? ""} placeholder="Model" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="serial_number" defaultValue={assetRecord.serial_number ?? ""} placeholder="Serial number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="manufacturer" defaultValue={assetRecord.manufacturer ?? ""} placeholder="Manufacturer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select name="status" defaultValue={assetRecord.status} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              <select name="location_id" defaultValue={assetRecord.location_id ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select location</option>
                {locations?.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <FormSubmitButton
              type="submit"
              pendingText="Saving..."
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save Changes
            </FormSubmitButton>
          </ServerActionForm>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Asset Images</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {assetImages.length} file{assetImages.length === 1 ? "" : "s"}
              </span>
            </div>
            {primaryImage ? (
              <div className="space-y-4">
                <img
                  src={primaryImage.downloadUrl}
                  alt={assetRecord.name}
                  className="h-72 w-full rounded-xl border border-slate-200 object-cover"
                />
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Latest upload {primaryImage.created_at ? formatDateRelative(primaryImage.created_at) : "recently"}
                  </p>
                  <form action={deleteAssetImageAction}>
                    <input type="hidden" name="asset_id" value={asset.id} />
                    <input type="hidden" name="document_id" value={primaryImage.id} />
                    <FormSubmitButton
                      type="submit"
                      pendingText="Deleting..."
                      className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      Delete Image
                    </FormSubmitButton>
                  </form>
                </div>
                {assetImages.length > 1 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {assetImages.slice(1).map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <a
                          href={image.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={image.downloadUrl}
                            alt={assetRecord.name}
                            className="h-24 w-full object-cover"
                          />
                        </a>
                        <div className="space-y-2 p-2">
                          <p className="text-[11px] text-slate-500">
                            {image.created_at ? formatDateRelative(image.created_at) : "Uploaded"}
                          </p>
                          <form action={deleteAssetImageAction}>
                            <input type="hidden" name="asset_id" value={asset.id} />
                            <input type="hidden" name="document_id" value={image.id} />
                            <FormSubmitButton
                              type="submit"
                              pendingText="Deleting..."
                              className="w-full rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                            >
                              Delete
                            </FormSubmitButton>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                No image uploaded for this asset yet.
              </div>
            )}
          </div>

          {/* Maintenance History */}
          {historyRecords.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Maintenance</h3>
              <div className="space-y-3">
                {historyRecords.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 capitalize">{h.event_type.replace("_", " ")}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      By {getPerformerName(h) || "Unknown"} {h.created_at ? formatDateRelative(h.created_at) : "Date unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* QR Code Sidebar */}
        <div className="space-y-6">
          <ServerActionForm
            action={uploadAssetImageAction}
            resetOnSuccess
            successMessage="Image uploaded successfully."
            encType="multipart/form-data"
            className="rounded-xl border border-slate-200 bg-slate-50 p-6 h-fit"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Image</h3>
            <input type="hidden" name="asset_id" value={assetRecord.id} />
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
            />
            <FormSubmitButton
              type="submit"
              pendingText="Uploading..."
              className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Upload Image
            </FormSubmitButton>
          </ServerActionForm>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-900 mb-4">QR Code</h3>

            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-xs text-slate-600 text-center break-all">{qrCode?.qr_token}</p>
                <a
                  href={qrCodeUrl}
                  download={`${assetRecord.name}-qr-code.png`}
                  className="block w-full rounded-lg bg-indigo-600 text-white text-center font-semibold py-2 hover:bg-indigo-700"
                >
                  Download QR Code
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">No QR code generated yet</p>
                <form action={generateQRTokenAction} className="space-y-2">
                  <input type="hidden" name="asset_id" value={assetRecord.id} />
                  <FormSubmitButton
                    type="submit"
                    pendingText="Generating..."
                    className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
                  >
                    Generate QR Code
                  </FormSubmitButton>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
