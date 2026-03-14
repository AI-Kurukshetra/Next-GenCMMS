import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRelative } from "@/lib/utils";

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

  // Get entity names
  const getEntityName = (doc: any) => {
    if (doc.entity_type === "asset") {
      return doc.asset?.name || "Unknown";
    } else if (doc.entity_type === "work_order") {
      return doc.work_order?.title || "Unknown";
    }
    return "Unknown";
  };

  const getDownloadUrl = (doc: any) => {
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

      <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
        <select name="entity_type" defaultValue={entityTypeFilter} className="rounded-lg border border-slate-300 px-3 py-2 text-sm col-span-3">
          <option value="">All documents</option>
          <option value="asset">Asset Documents</option>
          <option value="work_order">Work Order Documents</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

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
            {documents?.length ? (
              documents.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 capitalize text-slate-700 font-medium">{doc.entity_type}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{getEntityName(doc)}</td>
                  <td className="px-4 py-3 text-slate-600">{getFileNameFromPath(doc.path)}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.uploader?.full_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateRelative(doc.created_at)}</td>
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
