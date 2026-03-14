import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateRelative } from "@/lib/utils";
import { generateQRTokenAction, updateAssetAction, uploadAssetImageAction } from "@/app/dashboard/assets/actions";

type AssetDocument = {
  id: string;
  path: string;
  mime_type: string | null;
  created_at: string | null;
  downloadUrl: string;
};

type MaintenanceHistoryRecord = {
  id: string;
  event_type: string;
  created_at: string | null;
  performer: {
    full_name: string | null;
  } | null;
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

  const qrCodeUrl = qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/scan/${qrCode.qr_token}`)}`
    : null;
  const signedDocuments = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.path, 60);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        id: doc.id,
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

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/assets" className="text-indigo-600 text-sm hover:underline mb-2 block">
            ← Back to Assets
          </Link>
          <h2 className="text-3xl font-black text-slate-900">{asset.name}</h2>
          <p className="mt-1 text-slate-600">{asset.model || "No model specified"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Status</p>
          <p className="text-2xl font-bold text-slate-900 capitalize">{asset.status.replace("_", " ")}</p>
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
                <p className="text-base font-semibold text-slate-900">{asset.serial_number || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Manufacturer</p>
                <p className="text-base font-semibold text-slate-900">{asset.manufacturer || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Location</p>
                <p className="text-base font-semibold text-slate-900">{asset.locations?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Purchase Date</p>
                <p className="text-base font-semibold text-slate-900">{asset.purchase_date ? formatDate(asset.purchase_date) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Warranty Expiry</p>
                <p className="text-base font-semibold text-slate-900">{asset.warranty_expiry ? formatDate(asset.warranty_expiry) : "-"}</p>
              </div>
            </div>
          </div>

          <form action={updateAssetAction} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Asset</h3>
            <input type="hidden" name="id" value={asset.id} />
            <div className="grid grid-cols-2 gap-3">
              <input name="name" defaultValue={asset.name} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="model" defaultValue={asset.model ?? ""} placeholder="Model" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="serial_number" defaultValue={asset.serial_number ?? ""} placeholder="Serial number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input name="manufacturer" defaultValue={asset.manufacturer ?? ""} placeholder="Manufacturer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select name="status" defaultValue={asset.status} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              <select name="location_id" defaultValue={asset.location_id ?? ""} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select location</option>
                {locations?.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Save Changes
            </button>
          </form>

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
                  alt={asset.name}
                  className="h-72 w-full rounded-xl border border-slate-200 object-cover"
                />
                {assetImages.length > 1 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {assetImages.map((image) => (
                      <a
                        key={image.id}
                        href={image.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={image.downloadUrl}
                          alt={asset.name}
                          className="h-24 w-full object-cover"
                        />
                      </a>
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
                      By {h.performer?.full_name || "Unknown"} {formatDateRelative(h.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* QR Code Sidebar */}
        <div className="space-y-6">
          <form action={uploadAssetImageAction} encType="multipart/form-data" className="rounded-xl border border-slate-200 bg-slate-50 p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Image</h3>
            <input type="hidden" name="asset_id" value={asset.id} />
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
            />
            <button type="submit" className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Upload Image
            </button>
          </form>

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
                  download={`${asset.name}-qr-code.png`}
                  className="block w-full rounded-lg bg-indigo-600 text-white text-center font-semibold py-2 hover:bg-indigo-700"
                >
                  Download QR Code
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">No QR code generated yet</p>
                <form action={generateQRTokenAction} className="space-y-2">
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2 hover:bg-indigo-700"
                  >
                    Generate QR Code
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
