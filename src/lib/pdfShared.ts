import type { jsPDF } from "jspdf";

import playfairBoldUrl from "../assets/fonts/PlayfairDisplay-Bold.ttf";
import latoRegularUrl from "../assets/fonts/Lato-Regular.ttf";
import latoItalicUrl from "../assets/fonts/Lato-Italic.ttf";
import latoBoldUrl from "../assets/fonts/Lato-Bold.ttf";

export const ACCENT: [number, number, number] = [122, 59, 46];

export function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + " €";
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function loadImageAsPngDataUrl(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export async function loadPdfFonts(doc: jsPDF) {
  const [playfairBold, latoRegular, latoItalic, latoBold] = await Promise.all([
    fetchAsBase64(playfairBoldUrl),
    fetchAsBase64(latoRegularUrl),
    fetchAsBase64(latoItalicUrl),
    fetchAsBase64(latoBoldUrl),
  ]);
  doc.addFileToVFS("PlayfairDisplay-Bold.ttf", playfairBold);
  doc.addFont("PlayfairDisplay-Bold.ttf", "Playfair", "bold");
  doc.addFileToVFS("Lato-Regular.ttf", latoRegular);
  doc.addFont("Lato-Regular.ttf", "Lato", "normal");
  doc.addFileToVFS("Lato-Italic.ttf", latoItalic);
  doc.addFont("Lato-Italic.ttf", "Lato", "italic");
  doc.addFileToVFS("Lato-Bold.ttf", latoBold);
  doc.addFont("Lato-Bold.ttf", "Lato", "bold");
}
