import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

    // Find asset by QR token (public access, no RLS check needed here)
    const { data: qrCode } = await supabase
      .from("asset_qr_codes")
      .select("asset_id")
      .eq("qr_token", params.token)
      .maybeSingle();

    if (!qrCode) {
      redirect("/dashboard/assets?error=Invalid QR code");
    }

    // Redirect to asset detail page
    redirect(`/dashboard/assets/${qrCode.asset_id}`);
  } catch (error) {
    redirect("/dashboard/assets?error=Error scanning QR code");
  }
}
