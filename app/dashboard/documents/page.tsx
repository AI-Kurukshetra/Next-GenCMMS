import { FilterForm } from "@/components/filter-form";
import { requireProfile } from "@/lib/auth";
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
  asset:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
  work_order:
    | {
        title: string | null;
      }
    | {
        title: string | null;
      }[]
    | null;
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
      uploader:uploaded_by(full_name),
      asset:assets(id,name),
      work_order:work_orders(id,title)
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (entityTypeFilter) {
    query = query.eq("entity_type", entityTypeFilter);
  }

  const { data: documents } = await query;
  const documentRows = (documents ?? []) as DocumentRow[];

  function getSingleRelation<T>(relation: T | T[] | null): T | null {
    if (Array.isArray(relation)) {
      return relation[0] ?? null;
    }
    return relation ?? null;
  }

  const getEntityName = (doc: DocumentRow) => {
    if (doc.entity_type === "asset") {
      return getSingleRelation(doc.asset)?.name || "Unknown";
    } else if (doc.entity_type === "work_order") {
      return getSingleRelation(doc.work_order)?.title || "Unknown";
    }
    return "Unknown";
  };

  const getDownloadUrl = (doc: DocumentRow) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucket = doc.bucket;
    const path = doc.path;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  const getFileNameFromPath = (path: string) => {
    return path.split("/").pop() || "document";
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Documents</h2>
        <p className="mt-2 text-slate-600">Manage manuals, photos, and documentation</p>
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
            ],
          },
        ]}
      />

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">File</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Uploaded By</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentRows.length ? (
              documentRows.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 capitalize text-slate-700 font-medium">{doc.entity_type}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{getEntityName(doc)}</td>
                  <td className="px-4 py-3 text-slate-600">{getFileNameFromPath(doc.path)}</td>
                  <td className="px-4 py-3 text-slate-600">{getSingleRelation(doc.uploader)?.full_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{doc.created_at ? formatDateRelative(doc.created_at) : "Date unknown"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={getDownloadUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 text-xs font-semibold hover:underline"
                    >
                      Download
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
