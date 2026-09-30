const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE_MB = 5;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Formato no permitido (usa PNG, JPEG o WEBP).";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `El archivo supera los ${MAX_SIZE_MB} MB.`;
  }
  return null;
}
