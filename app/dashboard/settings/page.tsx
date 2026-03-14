import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
  updateOrgNameAction,
} from "@/app/dashboard/settings/actions";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { edit_location_id?: string };
}) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: org }, { data: locations }, { data: users }] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("id", profile.organization_id).single(),
    supabase.from("locations").select("id,name,code").eq("organization_id", profile.organization_id).order("name"),
    supabase.from("profiles").select("id,full_name,role,phone").eq("organization_id", profile.organization_id),
  ]);
  const editLocationId = (searchParams?.edit_location_id ?? "").trim();
  const editingLocation = locations?.find((loc) => loc.id === editLocationId);

  return (
    <section className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Settings</h2>
        <p className="mt-2 text-slate-600">Organization and account configuration</p>
      </div>

      {/* Organization Settings */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Organization</h3>
        <form action={updateOrgNameAction} className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              name="name"
              defaultValue={org?.name || ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 text-white font-semibold py-2 px-4 hover:bg-indigo-700">
            Update Organization
          </button>
        </form>
      </div>

      {/* Locations */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">Locations</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {locations?.length ? (
            locations.map((loc) => (
              <div key={loc.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{loc.name}</p>
                    {loc.code && <p className="text-sm text-slate-600 mt-1">Code: {loc.code}</p>}
                  </div>
                  <div className="flex gap-2">
                    <form action={deleteLocationAction}>
                      <input type="hidden" name="id" value={loc.id} />
                      <button type="submit" className="rounded bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-slate-500">No locations</div>
          )}
        </div>
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <form action={editingLocation ? updateLocationAction : createLocationAction} className="space-y-3">
            <h4 className="font-semibold text-slate-900">{editingLocation ? "Edit Location" : "Add Location"}</h4>
            {editingLocation && <input type="hidden" name="id" value={editingLocation.id} />}
            <input
              name="name"
              required
              defaultValue={editingLocation?.name ?? ""}
              placeholder="Location name *"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="code"
              defaultValue={editingLocation?.code ?? ""}
              placeholder="Location code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-indigo-600 text-white font-semibold py-2 px-4 hover:bg-indigo-700 text-sm">
              {editingLocation ? "Update Location" : "Add Location"}
            </button>
            {editingLocation && (
              <Link href="/dashboard/settings" className="ml-3 text-xs font-semibold text-slate-600 hover:text-slate-900">
                Cancel Edit
              </Link>
            )}
          </form>
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
