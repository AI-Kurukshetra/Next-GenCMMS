import { createDocumentAction } from "@/app/dashboard/documents/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    await createDocumentAction(formData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create document" },
      { status: 500 }
    );
  }
}
