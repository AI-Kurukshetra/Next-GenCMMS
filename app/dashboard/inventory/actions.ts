"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const DOCUMENTS_BUCKET = "documents";

async function uploadInventoryImage({
  partId,
  image,
  organizationId,
  uploadedBy,
}: {
  partId: string;
  image: File;
  organizationId: string;
  uploadedBy: string;
}) {
  const supabase = await createClient();

  const fileName = image.name.replace(/\s+/g, "_");
  const timestamp = Date.now();
  const key = `org/${organizationId}/inventory/${partId}/${timestamp}-${fileName}`;
  const uploadOptions = {
    contentType: image.type || "application/octet-stream",
    upsert: false,
  };

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(key, image, uploadOptions);

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    const shouldTryServiceRole =
      msg.includes("bucket not found") || msg.includes("row-level security policy");

    if (!shouldTryServiceRole) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    try {
      const serviceRoleClient = createServiceRoleClient();
      const { error: createBucketError } = await serviceRoleClient.storage.createBucket(DOCUMENTS_BUCKET, {
        public: false,
      });
      if (createBucketError && !createBucketError.message.toLowerCase().includes("already")) {
        throw new Error(createBucketError.message);
      }

      const imageBuffer = Buffer.from(await image.arrayBuffer());
      const { error: serviceUploadError } = await serviceRoleClient.storage
        .from(DOCUMENTS_BUCKET)
        .upload(key, imageBuffer, uploadOptions);

      if (serviceUploadError) {
        throw new Error(serviceUploadError.message);
      }
    } catch (bucketError) {
      const reason = bucketError instanceof Error ? bucketError.message : "Unknown bucket setup error";
      throw new Error(`Failed to upload image: bucket setup failed (${reason})`);
    }
  }

  const { error: documentError } = await supabase.from("documents").insert({
    organization_id: organizationId,
    entity_type: "inventory",
    entity_id: partId,
    bucket: DOCUMENTS_BUCKET,
    path: key,
    mime_type: image.type || null,
    uploaded_by: uploadedBy,
  });

  if (documentError) {
    throw new Error(`Failed to save image metadata: ${documentError.message}`);
  }
}

export async function createInventoryPartAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim() || null,
    quantity_on_hand: Number(formData.get("quantity_on_hand") ?? 0),
    reorder_threshold: Number(formData.get("reorder_threshold") ?? 0),
    unit_cost: formData.get("unit_cost") ? Number(formData.get("unit_cost")) : null,
  };

  if (!payload.name || !payload.location_id) {
    throw new Error("Part name and location are required.");
  }
  if (Number.isNaN(payload.quantity_on_hand) || payload.quantity_on_hand < 0) {
    throw new Error("Quantity on hand must be 0 or greater.");
  }
  if (Number.isNaN(payload.reorder_threshold) || payload.reorder_threshold < 0) {
    throw new Error("Reorder threshold must be 0 or greater.");
  }
  if (payload.unit_cost !== null && (Number.isNaN(payload.unit_cost) || payload.unit_cost < 0)) {
    throw new Error("Unit cost must be 0 or greater.");
  }

  const { data, error } = await supabase.from("inventory_parts").insert(payload).select("id").single();

  if (error) {
    throw new Error(`Failed to create part: ${error.message}`);
  }

  const partId = data.id;
  const imageFile = formData.get("image") as File | null;

  if (imageFile && imageFile.size > 0) {
    await uploadInventoryImage({
      partId,
      image: imageFile,
      organizationId: profile.organization_id,
      uploadedBy: profile.id,
    });
  }

  revalidatePath("/dashboard/inventory");
}

export async function updateInventoryPartAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const location_id = String(formData.get("location_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const quantity_on_hand = Number(formData.get("quantity_on_hand") ?? 0);
  const reorder_threshold = Number(formData.get("reorder_threshold") ?? 0);
  const unit_cost_raw = String(formData.get("unit_cost") ?? "").trim();
  const unit_cost = unit_cost_raw ? Number(unit_cost_raw) : null;

  if (!id || !name || !location_id) {
    throw new Error("Part ID, name, and location are required.");
  }
  if (Number.isNaN(quantity_on_hand) || quantity_on_hand < 0) {
    throw new Error("Quantity on hand must be 0 or greater.");
  }
  if (Number.isNaN(reorder_threshold) || reorder_threshold < 0) {
    throw new Error("Reorder threshold must be 0 or greater.");
  }
  if (unit_cost !== null && (Number.isNaN(unit_cost) || unit_cost < 0)) {
    throw new Error("Unit cost must be 0 or greater.");
  }

  const { error } = await supabase
    .from("inventory_parts")
    .update({
      name,
      location_id,
      sku: sku || null,
      quantity_on_hand,
      reorder_threshold,
      unit_cost,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update part: ${error.message}`);
  }

  const imageFile = formData.get("image") as File | null;

  if (imageFile && imageFile.size > 0) {
    await uploadInventoryImage({
      partId: id,
      image: imageFile,
      organizationId: profile.organization_id,
      uploadedBy: profile.id,
    });
  }

  revalidatePath("/dashboard/inventory");
}

export async function deleteInventoryPartAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Part ID is required.");
  }

  const { error } = await supabase
    .from("inventory_parts")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete part: ${error.message}`);
  }

  revalidatePath("/dashboard/inventory");
}
