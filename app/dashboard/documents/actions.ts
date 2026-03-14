"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createDocumentAction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const entity_type = formData.get("entity_type") as string;
  const entity_id = formData.get("entity_id") as string;
  const bucket = formData.get("bucket") as string;
  const path = formData.get("path") as string;
  const mime_type = formData.get("mime_type") as string;

  if (!entity_type || !entity_id || !bucket || !path) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase.from("documents").insert({
    organization_id: profile.organization_id,
    entity_type,
    entity_id,
    bucket,
    path,
    mime_type: mime_type || null,
    uploaded_by: profile.id,
  });

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  revalidatePath("/dashboard/documents");
}

export async function deleteDocumentAction(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Get document to find path
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("path, bucket")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (fetchError || !doc) {
    throw new Error("Document not found");
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(doc.bucket)
    .remove([doc.path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    // Continue anyway - at least delete the record
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }

  revalidatePath("/dashboard/documents");
}
