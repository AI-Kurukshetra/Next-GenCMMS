"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { randomUUID } from "crypto";

const DOCUMENTS_BUCKET = "documents";

async function uploadAssetImageForOrg({
  assetId,
  image,
  organizationId,
  uploadedBy,
}: {
  assetId: string;
  image: File;
  organizationId: string;
  uploadedBy: string;
}) {
  const supabase = await createClient();

  const fileName = image.name.replace(/\s+/g, "_");
  const timestamp = Date.now();
  const key = `org/${organizationId}/assets/${assetId}/${timestamp}-${fileName}`;
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
    entity_type: "asset",
    entity_id: assetId,
    bucket: DOCUMENTS_BUCKET,
    path: key,
    mime_type: image.type || null,
    uploaded_by: uploadedBy,
  });

  if (documentError) {
    throw new Error(`Failed to save image metadata: ${documentError.message}`);
  }
}

export async function createAssetAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const image = formData.get("image");

  const payload = {
    organization_id: profile.organization_id,
    location_id: String(formData.get("location_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim() || null,
    serial_number: String(formData.get("serial_number") ?? "").trim() || null,
    manufacturer: String(formData.get("manufacturer") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active"),
  };

  if (!payload.name || !payload.location_id) {
    throw new Error("Asset name and location are required.");
  }
  if (!(image instanceof File) || !image.size) {
    throw new Error("Asset image is required.");
  }

  const { data: asset, error: insertError } = await supabase
    .from("assets")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !asset) {
    throw new Error(`Failed to create asset: ${insertError?.message ?? "Unknown error"}`);
  }

  await uploadAssetImageForOrg({
    assetId: asset.id,
    image,
    organizationId: profile.organization_id,
    uploadedBy: profile.id,
  });

  revalidatePath("/dashboard/assets");
}

export async function uploadAssetImageAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const assetId = String(formData.get("asset_id") ?? "").trim();
  const image = formData.get("image");

  if (!assetId) {
    throw new Error("Asset ID is required.");
  }
  if (!(image instanceof File) || !image.size) {
    throw new Error("Image file is required.");
  }

  const { data: asset, error } = await supabase
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error || !asset) {
    throw new Error("Asset not found.");
  }

  await uploadAssetImageForOrg({
    assetId,
    image,
    organizationId: profile.organization_id,
    uploadedBy: profile.id,
  });

  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
}

export async function deleteAssetImageAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const documentId = String(formData.get("document_id") ?? "").trim();
  const assetId = String(formData.get("asset_id") ?? "").trim();

  if (!documentId || !assetId) {
    throw new Error("Document ID and asset ID are required.");
  }

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (assetError || !asset) {
    throw new Error("Asset not found.");
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id,bucket,path,entity_id")
    .eq("id", documentId)
    .eq("organization_id", profile.organization_id)
    .eq("entity_type", "asset")
    .eq("entity_id", assetId)
    .maybeSingle();

  if (documentError || !document) {
    throw new Error("Image not found.");
  }

  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceRoleClient() : supabase;
  const { error: removeError } = await storageClient.storage.from(document.bucket).remove([document.path]);

  if (removeError && !removeError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to delete image file: ${removeError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id)
    .eq("organization_id", profile.organization_id);

  if (deleteError) {
    throw new Error(`Failed to delete image record: ${deleteError.message}`);
  }

  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
}

export async function generateQRTokenAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const asset_id = formData.get("asset_id") as string;

  if (!asset_id) {
    throw new Error("Asset ID is required");
  }

  // Check if QR code already exists
  const { data: existing } = await supabase
    .from("asset_qr_codes")
    .select("id")
    .eq("asset_id", asset_id)
    .maybeSingle();

  if (existing) {
    revalidatePath(`/dashboard/assets/${asset_id}`);
    return;
  }

  const qrToken = randomUUID();

  const { error } = await supabase.from("asset_qr_codes").insert({
    organization_id: profile.organization_id,
    asset_id,
    qr_token: qrToken,
  });

  if (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }

  revalidatePath(`/dashboard/assets/${asset_id}`);
}

export async function updateAssetAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const location_id = String(formData.get("location_id") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const serial_number = String(formData.get("serial_number") ?? "").trim();
  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowedStatuses = new Set(["active", "inactive", "under_maintenance", "retired"]);

  if (!id || !name || !location_id || !allowedStatuses.has(status)) {
    throw new Error("Valid asset ID, name, location, and status are required.");
  }

  const { error } = await supabase
    .from("assets")
    .update({
      name,
      location_id,
      model: model || null,
      serial_number: serial_number || null,
      manufacturer: manufacturer || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${id}`);
}

export async function deleteAssetAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Asset ID is required.");
  }

  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }

  revalidatePath("/dashboard/assets");
}
