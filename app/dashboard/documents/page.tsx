import { FilterForm } from "@/components/filter-form";
import { requireProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

type DocumentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  bucket: string;
  path: string;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string | null;
  uploader:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

type DocumentWithUrl = DocumentRow & {
  downloadUrl: string;
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: { entity_type?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const entityTypeFilter = (searchParams?.entity_type ?? "").trim();

  let query = supabase
    .from("documents")
    .select(`
      id,
      entity_type,
      entity_id,
      bucket,
      path,
      mime_type,
      uploaded_by,
      created_at,
      uploader:uploaded_by(full_name)
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (entityTypeFilter) {
    query = query.eq("entity_type", entityTypeFilter);
  }

  const { data: documents } = await query;
  const documentRows = (documents ?? []) as DocumentRow[];
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
  const documentsWithUrls = (
    await Promise.all(
      documentRows.map(async (doc) => {
        const { data } = await storageClient.storage.from(doc.bucket).createSignedUrl(doc.path, 3600);
        if (!data?.signedUrl) {
          return null;
        }

        return {
          ...doc,
          downloadUrl: data.signedUrl,
        } satisfies DocumentWithUrl;
      })
    )
  ).filter((doc): doc is DocumentWithUrl => Boolean(doc));

  const assetIds = Array.from(
    new Set(documentsWithUrls.filter((doc) => doc.entity_type === "asset").map((doc) => doc.entity_id))
  );
  const workOrderIds = Array.from(
    new Set(documentsWithUrls.filter((doc) => doc.entity_type === "work_order").map((doc) => doc.entity_id))
  );
  const inventoryIds = Array.from(
    new Set(
      documentsWithUrls
        .filter((doc) => doc.entity_type === "inventory" || doc.entity_type === "inventory_part")
        .map((doc) => doc.entity_id)
    )
  );

  const [assetsResult, workOrdersResult, inventoryResult] = await Promise.all([
    assetIds.length
      ? supabase.from("assets").select("id,name").in("id", assetIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    workOrderIds.length
      ? supabase.from("work_orders").select("id,title").in("id", workOrderIds)
      : Promise.resolve({ data: [] as { id: string; title: string | null }[] }),
    inventoryIds.length
      ? supabase.from("inventory_parts").select("id,name").in("id", inventoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
  ]);

  const assetNameById = Object.fromEntries((assetsResult.data ?? []).map((a) => [a.id, a.name ?? "Unknown"]));
  const workOrderNameById = Object.fromEntries((workOrdersResult.data ?? []).map((wo) => [wo.id, wo.title ?? "Unknown"]));
  const inventoryNameById = Object.fromEntries((inventoryResult.data ?? []).map((item) => [item.id, item.name ?? "Unknown"]));

  function getSingleRelation<T>(relation: T | T[] | null): T | null {
    if (Array.isArray(relation)) {
      return relation[0] ?? null;
    }
    return relation ?? null;
  }

  const getEntityName = (doc: DocumentWithUrl) => {
    if (doc.entity_type === "asset") {
      return assetNameById[doc.entity_id] || "Unknown";
    } else if (doc.entity_type === "work_order") {
      return workOrderNameById[doc.entity_id] || "Unknown";
    } else if (doc.entity_type === "inventory" || doc.entity_type === "inventory_part") {
      return inventoryNameById[doc.entity_id] || "Unknown";
    }
    return "Unknown";
  };

  const getFileNameFromPath = (path: string) => {
    return path.split("/").pop() || "document";
  };

  const assetDocsCount = documentsWithUrls.filter((doc) => doc.entity_type === "asset").length;
  const workOrderDocsCount = documentsWithUrls.filter((doc) => doc.entity_type === "work_order").length;
  const inventoryDocsCount = documentsWithUrls.filter(
    (doc) => doc.entity_type === "inventory" || doc.entity_type === "inventory_part"
  ).length;

  const getTypeLabel = (entityType: string) => {
    if (entityType === "asset") return "Asset";
    if (entityType === "work_order") return "Work Order";
    if (entityType === "inventory" || entityType === "inventory_part") return "Inventory";
    return entityType.replaceAll("_", " ");
  };

  const getTypeClasses = (entityType: string) => {
    if (entityType === "asset") {
      return "bg-indigo-50 text-indigo-700 ring-indigo-100";
    }
    if (entityType === "work_order") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }
    if (entityType === "inventory" || entityType === "inventory_part") {
      return "bg-orange-50 text-orange-700 ring-orange-100";
    }
    return "bg-slate-100 text-slate-700 ring-slate-200";
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Documents</h2>
        <p className="mt-2 text-slate-600">Manage manuals, photos, and documentation</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{documentRows.length}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">Asset Docs</p>
          <p className="mt-2 text-2xl font-black text-indigo-900">{assetDocsCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">Work Order Docs</p>
          <p className="mt-2 text-2xl font-black text-emerald-900">{workOrderDocsCount}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">Inventory Docs</p>
          <p className="mt-2 text-2xl font-black text-orange-900">{inventoryDocsCount}</p>
        </div>
      </div>

      <FilterForm
        fields={[
          {
            name: 'entity_type',
            label: 'All documents',
            type: 'select',
            options: [
              { value: 'asset', label: 'Asset Documents' },
              { value: 'work_order', label: 'Work Order Documents' },
              { value: 'inventory', label: 'Inventory Documents' },
              { value: 'inventory_part', label: 'Inventory Part Documents' },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Documents Library</h4>
              <p className="mt-1 text-xs text-slate-500">Uploaded files grouped by assets, work orders, and inventory.</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {documentsWithUrls.length} files
            </div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentsWithUrls.length ? (
              documentsWithUrls.map((doc) => (
                <tr key={doc.id} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${getTypeClasses(doc.entity_type)}`}>
                      {getTypeLabel(doc.entity_type)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">{getEntityName(doc)}</td>
                  <td className="px-4 py-4">
                    <p className="max-w-[300px] truncate font-medium text-slate-700">{getFileNameFromPath(doc.path)}</p>
                    <p className="mt-1 text-xs text-slate-500">{doc.mime_type || "Unknown type"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{getSingleRelation(doc.uploader)?.full_name || "-"}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{doc.created_at ? formatDateRelative(doc.created_at) : "Date unknown"}</td>
                  <td className="px-4 py-4 text-right">
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No documents yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
