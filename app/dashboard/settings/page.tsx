import {
  createLocationAction,
  createTechnicianAction,
  deleteLocationAction,
  updateOrgNameAction,
} from "@/app/dashboard/settings/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: org }, { data: locations }, { data: users }] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("id", profile.organization_id).single(),
    supabase.from("locations").select("id,name,code").eq("organization_id", profile.organization_id).order("name"),
    supabase.from("profiles").select("id,full_name,role,phone").eq("organization_id", profile.organization_id),
  ]);
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Settings</h2>
        <p className="mt-2 text-slate-600">Organization and account configuration</p>
      </div>

      {/* Organization Settings */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Organization</h3>
        <ServerActionForm
          action={updateOrgNameAction}
          successMessage="Organization updated successfully."
          className="mt-4 space-y-3"
        >
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              name="name"
              defaultValue={org?.name || ""}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
          </div>
          <FormSubmitButton
            type="submit"
            pendingText="Saving..."
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Update Organization
          </FormSubmitButton>
        </ServerActionForm>
      </div>

      {/* Locations */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Locations</h3>
              <p className="mt-1 text-xs text-slate-500">Sites and areas used across modules</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {locations?.length || 0} total
            </div>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations?.length ? (
              locations.map((loc) => (
                <tr key={loc.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">{loc.name}</td>
                  <td className="px-4 py-4 text-slate-600">{loc.code || "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/dashboard/settings/locations/${loc.id}`}
                        className="rounded bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                      >
                        View
                      </a>
                      <form action={deleteLocationAction}>
                        <input type="hidden" name="id" value={loc.id} />
                        <FormSubmitButton
                          type="submit"
                          pendingText="Deleting..."
                          className="rounded bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
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
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">No locations</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <ServerActionForm
            action={createLocationAction}
            resetOnSuccess
            successMessage="Location added successfully."
            className="space-y-3"
          >
            <h4 className="font-semibold text-slate-900">Add Location</h4>
            <input
              name="name"
              required
              placeholder="Location name *"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="code"
              placeholder="Location code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <FormSubmitButton
              type="submit"
              pendingText="Saving..."
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add Location
            </FormSubmitButton>
          </ServerActionForm>
        </div>
      </div>

      {/* Users */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Users</h3>
              <p className="mt-1 text-xs text-slate-500">Team members in your organization</p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {users?.length || 0} total
            </div>
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
          <ServerActionForm
            action={createTechnicianAction}
            resetOnSuccess
            successMessage="Technician created successfully."
            className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]"
          >
            <input
              name="full_name"
              required
              placeholder="Full name *"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email *"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="Phone"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="text"
              minLength={8}
              required
              placeholder="Temp password *"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <FormSubmitButton
              type="submit"
              pendingText="Creating..."
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add Technician
            </FormSubmitButton>
          </ServerActionForm>
          <p className="mt-2 text-xs text-slate-500">
            Share the email and temporary password with technician. They can log in from mobile app (no signup needed).
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-medium text-slate-900">{user.full_name || "Technician"}</td>
                  <td className="px-4 py-4 capitalize text-slate-600">{user.role.replace("_", " ")}</td>
                  <td className="px-4 py-4 text-slate-600">{user.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
