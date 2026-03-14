"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";

export function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [scannedToken, setScannedToken] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setScanning(true);
          scanQR();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to access camera");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const scanQR = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) {
        clearInterval(interval);
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        setScannedToken(code.data);
        // Extract token from URL
        const match = code.data.match(/\/scan\/([a-f0-9-]+)$/);
        if (match) {
          clearInterval(interval);
          router.push(`/scan/${match[1]}`);
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
              style={{ aspectRatio: "1" }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {scannedToken && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-600">✓ QR Code detected! Redirecting...</p>
            </div>
          )}
          {scanning && !scannedToken && (
            <p className="text-center text-sm text-slate-600">Point your camera at an asset QR code</p>
          )}
        </>
      )}
    </div>
  );
}
