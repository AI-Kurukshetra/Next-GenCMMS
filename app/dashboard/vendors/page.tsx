import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VendorsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id,name,email,phone,services,performance_score")
    .eq("organization_id", profile.organization_id)
    .order("name");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Vendors</h2>
        <p className="mt-2 text-slate-600">Manage suppliers and service providers</p>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Services</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors?.length ? vendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
                <td className="px-4 py-3 text-slate-600">{v.services || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{v.email || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{v.phone || "-"}</td>
                <td className="px-4 py-3">{"⭐ " + (v.performance_score || "N/A")}</td>
              </tr>
            )) : <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No vendors yet</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
