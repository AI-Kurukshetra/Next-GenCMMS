"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const DOCUMENTS_BUCKET = "documents";

async function uploadPODocumentHelper({
  poId,
  document,
  organizationId,
  uploadedBy,
}: {
  poId: string;
  document: File;
  organizationId: string;
  uploadedBy: string;
}) {
  const supabase = await createClient();

  const fileName = document.name.replace(/\s+/g, "_");
  const timestamp = Date.now();
  const key = `org/${organizationId}/purchase-orders/${poId}/${timestamp}-${fileName}`;
  const uploadOptions = {
    contentType: document.type || "application/octet-stream",
    upsert: false,
  };

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(key, document, uploadOptions);

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    const shouldTryServiceRole =
      msg.includes("bucket not found") || msg.includes("row-level security policy");

    if (!shouldTryServiceRole) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    try {
      const serviceRoleClient = createServiceRoleClient();
      const { error: createBucketError } = await serviceRoleClient.storage.createBucket(DOCUMENTS_BUCKET, {
        public: false,
      });
      if (createBucketError && !createBucketError.message.toLowerCase().includes("already")) {
        throw new Error(createBucketError.message);
      }

      const docBuffer = Buffer.from(await document.arrayBuffer());
      const { error: serviceUploadError } = await serviceRoleClient.storage
        .from(DOCUMENTS_BUCKET)
        .upload(key, docBuffer, uploadOptions);

      if (serviceUploadError) {
        throw new Error(serviceUploadError.message);
      }
    } catch (bucketError) {
      const reason = bucketError instanceof Error ? bucketError.message : "Unknown bucket setup error";
      throw new Error(`Failed to upload document: bucket setup failed (${reason})`);
    }
  }

  const { error: documentError } = await supabase.from("documents").insert({
    organization_id: organizationId,
    entity_type: "purchase_order",
    entity_id: poId,
    bucket: DOCUMENTS_BUCKET,
    path: key,
    mime_type: document.type || null,
    uploaded_by: uploadedBy,
  });

  if (documentError) {
    throw new Error(`Failed to save document metadata: ${documentError.message}`);
  }
}

export async function createPurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const vendor_id = String(formData.get("vendor_id") ?? "").trim();
  const po_number = String(formData.get("po_number") ?? "").trim();
  const order_date = String(formData.get("order_date") ?? "").trim();
  const expected_date = String(formData.get("expected_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!vendor_id || !po_number || !order_date) {
    throw new Error("Vendor, PO number, and order date are required");
  }

  const { error } = await supabase.from("purchase_orders").insert({
    organization_id: profile.organization_id,
    vendor_id,
    po_number,
    order_date,
    expected_date: expected_date || null,
    notes: notes || null,
    status: "draft",
    created_by: profile.id,
  });

  if (error) {
    throw new Error(`Failed to create PO: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
}

export async function addPurchaseOrderItemAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const purchase_order_id = formData.get("purchase_order_id") as string;
  const inventory_part_id = formData.get("inventory_part_id") as string;
  const quantity_ordered = formData.get("quantity_ordered") as string;
  const unit_cost = formData.get("unit_cost") as string;

  if (!purchase_order_id || !inventory_part_id || !quantity_ordered) {
    throw new Error("PO, part, and quantity are required");
  }
  const quantity = Number(quantity_ordered);
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }
  const parsedUnitCost = unit_cost ? Number(unit_cost) : null;
  if (parsedUnitCost !== null && (Number.isNaN(parsedUnitCost) || parsedUnitCost < 0)) {
    throw new Error("Unit cost must be 0 or greater.");
  }

  const { error } = await supabase.from("purchase_order_items").insert({
    organization_id: profile.organization_id,
    purchase_order_id,
    inventory_part_id,
    quantity_ordered: quantity,
    unit_cost: parsedUnitCost,
  });

  if (error) {
    throw new Error(`Failed to add PO item: ${error.message}`);
  }

  revalidatePath(`/dashboard/purchase-orders/${purchase_order_id}`);
}

export async function updatePurchaseOrderStatusAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["draft", "sent", "received", "cancelled"]);
  if (!id || !status || !allowedStatuses.has(status)) {
    throw new Error("Valid purchase order ID and status are required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update PO status: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
  revalidatePath(`/dashboard/purchase-orders/${id}`);
}

export async function updatePurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const vendor_id = String(formData.get("vendor_id") ?? "").trim();
  const po_number = String(formData.get("po_number") ?? "").trim();
  const order_date = String(formData.get("order_date") ?? "").trim();
  const expected_date = String(formData.get("expected_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["draft", "sent", "received", "cancelled"]);

  if (!id || !vendor_id || !po_number || !order_date || !allowedStatuses.has(status)) {
    throw new Error("Valid PO ID, vendor, PO number, order date, and status are required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      vendor_id,
      po_number,
      order_date,
      expected_date: expected_date || null,
      notes: notes || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update PO: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
  revalidatePath(`/dashboard/purchase-orders/${id}`);
}

export async function deletePurchaseOrderAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Purchase order ID is required.");
  }

  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete purchase order: ${error.message}`);
  }

  revalidatePath("/dashboard/purchase-orders");
}

export async function uploadPODocumentAction(formData: FormData) {
  const profile = await requireProfile();
  const purchase_order_id = String(formData.get("purchase_order_id") ?? "").trim();
  const documentFile = formData.get("document") as File | null;

  if (!purchase_order_id) {
    throw new Error("Purchase order ID is required.");
  }

  if (!documentFile || documentFile.size === 0) {
    throw new Error("Document file is required.");
  }

  await uploadPODocumentHelper({
    poId: purchase_order_id,
    document: documentFile,
    organizationId: profile.organization_id,
    uploadedBy: profile.id,
  });

  revalidatePath(`/dashboard/purchase-orders/${purchase_order_id}`);
}
