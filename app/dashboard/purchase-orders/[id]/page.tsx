import Link from "next/link";
import { addPurchaseOrderItemAction, updatePurchaseOrderAction, uploadPODocumentAction } from "@/app/dashboard/purchase-orders/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServerActionForm } from "@/components/server-action-form";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { formatDate, formatCurrency } from "@/lib/utils";

type PurchaseOrderItemRecord = {
  id: string;
  quantity_ordered: number | string;
  unit_cost: number | string | null;
  inventory_parts:
    | {
        name: string | null;
        sku: string | null;
      }
    | {
        name: string | null;
        sku: string | null;
      }[]
    | null;
};

type DocumentRecord = {
  id: string;
  bucket: string;
  entity_id: string;
  path: string;
  mime_type: string | null;
  created_at: string | null;
};

type DocumentWithUrl = DocumentRecord & {
  downloadUrl: string;
};

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: po }, { data: items }, { data: parts }, { data: vendors }, { data: documents }] = await Promise.all([
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
    supabase
      .from("documents")
      .select("id,bucket,entity_id,path,mime_type,created_at")
      .eq("organization_id", profile.organization_id)
      .eq("entity_type", "purchase_order")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!po) {
    return <div className="text-center py-12 text-slate-500">Purchase order not found</div>;
  }

  const documentRecords = (documents ?? []) as DocumentRecord[];
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
  const signedDocuments = await Promise.all(
    documentRecords.map(async (doc) => {
      const { data, error } = await storageClient.storage.from(doc.bucket).createSignedUrl(doc.path, 3600);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        ...doc,
        downloadUrl: data.signedUrl,
      };
    })
  );

  const validDocuments = signedDocuments.filter((doc): doc is DocumentWithUrl => doc !== null);

  const purchaseOrderItems = (items ?? []) as PurchaseOrderItemRecord[];
  const totalItems = purchaseOrderItems.reduce(
    (sum, item) => sum + parseFloat(String(item.quantity_ordered)) * (parseFloat(String(item.unit_cost ?? 0)) || 0),
    0
  );

  function getItemPart(item: PurchaseOrderItemRecord) {
    if (Array.isArray(item.inventory_parts)) {
      return item.inventory_parts[0] ?? null;
    }

    return item.inventory_parts ?? null;
  }

  function getVendorName() {
    if (!po) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vendors = po.vendors as any;
    if (Array.isArray(vendors)) {
      return vendors[0]?.name ?? null;
    }
    return vendors?.name ?? null;
  }

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
                <p className="text-base font-semibold text-slate-900">{getVendorName()}</p>
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
                  {purchaseOrderItems.length ? (
                    purchaseOrderItems.map((item) => {
                      const part = getItemPart(item);
                      return (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{part?.name || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{part?.sku || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.quantity_ordered}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(parseFloat(String(item.unit_cost ?? 0)) || 0)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(
                            parseFloat(String(item.quantity_ordered)) * (parseFloat(String(item.unit_cost ?? 0)) || 0)
                          )}
                        </td>
                      </tr>
                      );
                    })
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

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Documents</h3>

            <ServerActionForm
              action={uploadPODocumentAction}
              resetOnSuccess
              successMessage="Document uploaded successfully."
              encType="multipart/form-data"
              className="space-y-3 mb-4 pb-4 border-b border-slate-200"
            >
              <input type="hidden" name="purchase_order_id" value={po.id} />
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Upload Invoice / Receipt (optional)
                </label>
                <input
                  type="file"
                  name="document"
                  accept="image/*,.pdf"
                  className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <FormSubmitButton
                type="submit"
                pendingText="Uploading..."
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Upload
              </FormSubmitButton>
            </ServerActionForm>

            {validDocuments.length > 0 ? (
              <div className="space-y-2">
                {validDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {doc.path.split("/").pop()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.created_at ? formatDate(doc.created_at) : "Date unknown"}
                      </p>
                    </div>
                    <a
                      href={doc.downloadUrl}
                      download
                      className="ml-2 rounded bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded yet</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
