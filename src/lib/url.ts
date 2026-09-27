export function appUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${window.location.origin}${base}/${cleanPath}`;
}
