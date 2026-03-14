import Link from "next/link";
import { addPurchaseOrderItemAction, updatePurchaseOrderAction } from "@/app/dashboard/purchase-orders/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: po }, { data: items }, { data: parts }, { data: vendors }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id,po_number,status,order_date,expected_date,notes,total_amount,vendor_id,vendors(id,name),created_by")
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("purchase_order_items")
      .select("id,quantity_ordered,unit_cost,inventory_parts(id,name,sku)")
      .eq("purchase_order_id", params.id)
      .eq("organization_id", profile.organization_id),
    supabase
      .from("inventory_parts")
      .select("id,name,sku,quantity_on_hand")
      .eq("organization_id", profile.organization_id)
      .order("name"),
    supabase
      .from("vendors")
      .select("id,name")
      .eq("organization_id", profile.organization_id)
      .order("name"),
  ]);

  if (!po) {
    return <div className="text-center py-12 text-slate-500">Purchase order not found</div>;
  }

  const totalItems = items?.reduce((sum, item) => sum + (parseFloat(item.quantity_ordered) * (parseFloat(item.unit_cost) || 0)), 0) || 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/purchase-orders" className="text-indigo-600 text-sm hover:underline mb-2 block">
            ← Back to Purchase Orders
          </Link>
          <h2 className="text-3xl font-black text-slate-900">PO {po.po_number}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Status</p>
          <p className="text-2xl font-bold text-slate-900 capitalize">{po.status}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Vendor</p>
                <p className="text-base font-semibold text-slate-900">{po.vendors?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Order Date</p>
                <p className="text-base font-semibold text-slate-900">{formatDate(po.order_date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Expected Delivery</p>
                <p className="text-base font-semibold text-slate-900">{po.expected_date ? formatDate(po.expected_date) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Amount</p>
                <p className="text-base font-semibold text-slate-900">{formatCurrency(totalItems)}</p>
              </div>
            </div>
            {po.notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">Notes</p>
                <p className="text-base text-slate-900">{po.notes}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Line Items</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Part</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">SKU</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Unit Cost</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.length ? (
                    items.map((item: any) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.inventory_parts?.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.inventory_parts?.sku || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.quantity_ordered}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(parseFloat(item.unit_cost) || 0)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(parseFloat(item.quantity_ordered) * (parseFloat(item.unit_cost) || 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No line items yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ServerActionForm
            action={updatePurchaseOrderAction}
            successMessage="Purchase order updated successfully."
            className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
          >
            <h3 className="text-base font-bold text-slate-900">Edit Purchase Order</h3>
            <input type="hidden" name="id" value={po.id} />
            <select name="vendor_id" defaultValue={po.vendor_id ?? ""} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select vendor *</option>
              {vendors?.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <input name="po_number" defaultValue={po.po_number} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="order_date" type="date" defaultValue={po.order_date} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="expected_date" type="date" defaultValue={po.expected_date ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select name="status" defaultValue={po.status} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="received">received</option>
              <option value="cancelled">cancelled</option>
            </select>
            <textarea name="notes" defaultValue={po.notes ?? ""} rows={2} placeholder="Notes" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <FormSubmitButton
              type="submit"
              pendingText="Saving..."
              className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Save Changes
            </FormSubmitButton>
          </ServerActionForm>

          <ServerActionForm
            action={addPurchaseOrderItemAction}
            resetOnSuccess
            successMessage="Line item added successfully."
            className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 h-fit"
          >
            <h3 className="text-base font-bold text-slate-900">Add Line Item</h3>
            <input type="hidden" name="purchase_order_id" value={po.id} />
            <select name="inventory_part_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select part *</option>
              {parts?.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} (Stock: {part.quantity_on_hand})
                </option>
              ))}
            </select>
            <input name="quantity_ordered" type="number" step="0.01" min="0.01" required placeholder="Quantity *" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="unit_cost" type="number" step="0.01" min="0" placeholder="Unit cost" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <FormSubmitButton
              type="submit"
              pendingText="Adding..."
              className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Add Item
            </FormSubmitButton>
          </ServerActionForm>
        </div>
      </div>
    </section>
  );
}
