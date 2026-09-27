import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./ui/button";

export function QrDownload({
  url,
  logoUrl,
  fileName,
}: {
  url: string;
  logoUrl: string | null;
  fileName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await QRCode.toCanvas(canvas, url, {
        width: 480,
        margin: 2,
        color: { dark: "#1c1c1c", light: "#ffffff" },
      });
      // qrcode sets inline width/height matching the pixel size above,
      // which overrides our Tailwind classes and can overflow narrow screens.
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      if (logoUrl) {
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled || !ctx) return;
          const size = canvas.width * 0.22;
          const x = (canvas.width - size) / 2;
          const y = (canvas.height - size) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, size / 2 + 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x, y, size, size);
          ctx.restore();
          setReady(true);
        };
        img.onerror = () => setReady(true);
        img.src = logoUrl;
      } else {
        setReady(true);
      }
    }

    setReady(false);
    draw();
    return () => {
      cancelled = true;
    };
  }, [url, logoUrl]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileName}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="w-48 max-w-full rounded-lg border" />
      <Button onClick={download} disabled={!ready} size="sm">
        Descargar mi código QR
      </Button>
    </div>
  );
}
