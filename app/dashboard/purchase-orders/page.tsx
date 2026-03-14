import Link from "next/link";
import {
  createPurchaseOrderAction,
  deletePurchaseOrderAction,
  updatePurchaseOrderStatusAction,
} from "@/app/dashboard/purchase-orders/actions";
import { FilterForm } from "@/components/filter-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type PurchaseOrderRecord = {
  id: string;
  po_number: string;
  status: string;
  order_date: string;
  expected_date: string | null;
  total_amount: number | string | null;
  notes: string | null;
  vendor_id: string | null;
  vendors:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; vendor_id?: string };
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const vendor_id = (searchParams?.vendor_id ?? "").trim();

  let query = supabase
    .from("purchase_orders")
    .select("id,po_number,status,order_date,expected_date,total_amount,notes,vendor_id,vendors(id,name)")
    .eq("organization_id", profile.organization_id)
    .order("order_date", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }
  if (vendor_id) {
    query = query.eq("vendor_id", vendor_id);
  }
  if (q) {
    query = query.ilike("po_number", `%${q}%`);
  }

  const [{ data: pos }, { data: vendors }] = await Promise.all([
    query,
    supabase.from("vendors").select("id,name").eq("organization_id", profile.organization_id).order("name"),
  ]);
  const purchaseOrders = (pos ?? []) as PurchaseOrderRecord[];

  const statusOptions = ["draft", "sent", "received", "cancelled"];

  function getVendorName(po: PurchaseOrderRecord) {
    if (Array.isArray(po.vendors)) {
      return po.vendors[0]?.name ?? null;
    }

    return po.vendors?.name ?? null;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Purchase Orders</h2>
        <p className="mt-2 text-slate-600">Create and track purchase orders for parts and services</p>
      </div>

      <FilterForm
        fields={[
          {
            name: 'q',
            label: 'Search',
            type: 'text',
            placeholder: 'Search PO number',
          },
          {
            name: 'status',
            label: 'All statuses',
            type: 'select',
            options: statusOptions.map((s) => ({ value: s, label: s })),
          },
          {
            name: 'vendor_id',
            label: 'All vendors',
            type: 'select',
            options: vendors?.map((v) => ({ value: v.id, label: v.name })) || [],
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <ServerActionForm
          action={createPurchaseOrderAction}
          resetOnSuccess
          successMessage="Purchase order created successfully."
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
        >
          <h3 className="text-base font-bold text-slate-900">Create PO</h3>
          <select name="vendor_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select vendor *</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input name="po_number" required placeholder="PO number *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="order_date" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="expected_date" type="date" placeholder="Expected delivery" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Notes" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <FormSubmitButton
            type="submit"
            pendingText="Creating..."
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Create
          </FormSubmitButton>
        </ServerActionForm>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">PO Number</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Order Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.length ? (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/purchase-orders/${po.id}`} className="text-indigo-600 hover:underline">
                        {po.po_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getVendorName(po) || "-"}</td>
                    <td className="px-4 py-3">
                      <form action={updatePurchaseOrderStatusAction} className="flex gap-1">
                        <input type="hidden" name="id" value={po.id} />
                        <select name="status" defaultValue={po.status} required className="rounded text-xs px-2 py-1 border border-slate-300">
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <FormSubmitButton
                          type="submit"
                          pendingText="Updating..."
                          className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                        >
                          Update
                        </FormSubmitButton>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(po.order_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/purchase-orders/${po.id}`} className="text-indigo-600 text-xs font-semibold hover:underline">
                          View
                        </Link>
                        <form action={deletePurchaseOrderAction}>
                          <input type="hidden" name="id" value={po.id} />
                          <FormSubmitButton
                            type="submit"
                            pendingText="Deleting..."
                            className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
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
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No purchase orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
