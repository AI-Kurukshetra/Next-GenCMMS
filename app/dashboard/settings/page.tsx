import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: org }, { data: locations }, { data: users }] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("id", profile.organization_id).single(),
    supabase.from("locations").select("id,name").eq("organization_id", profile.organization_id).order("name"),
    supabase.from("profiles").select("id,full_name,role,phone").eq("organization_id", profile.organization_id),
  ]);

  return (
    <section className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Settings</h2>
        <p className="mt-2 text-slate-600">Organization and account configuration</p>
      </div>

      {/* Organization Settings */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Organization</h3>
        <div className="mt-4">
          <p className="text-sm text-slate-600">Name</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{org?.name}</p>
        </div>
      </div>

      {/* Locations */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">Locations</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {locations?.length ? locations.map((loc) => (
            <div key={loc.id} className="px-6 py-4">
              <p className="font-medium text-slate-900">{loc.name}</p>
            </div>
          )) : <div className="px-6 py-4 text-slate-500">No locations</div>}
        </div>
      </div>

      {/* Users */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">Users</h3>
        </div>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{user.full_name || "User"}</td>
                  <td className="px-6 py-3 capitalize text-slate-600">{user.role.replace("_", " ")}</td>
                  <td className="px-6 py-3 text-slate-600">{user.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
