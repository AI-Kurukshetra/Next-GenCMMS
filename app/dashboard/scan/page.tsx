import { QRScanner } from "@/components/qr-scanner";
import Link from "next/link";

export default function ScanPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Scan QR Code</h2>
        <p className="mt-2 text-slate-600">Scan an asset QR code to view details</p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <QRScanner />
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-center">
              Need to generate a QR code?{" "}
              <Link href="/dashboard/assets" className="text-indigo-600 font-semibold hover:underline">
                Go to Assets
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
