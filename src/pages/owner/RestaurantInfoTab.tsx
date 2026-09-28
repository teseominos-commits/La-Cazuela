import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { appUrl } from "../../lib/url";
import { fileExtension } from "../../lib/files";
import { downloadMenuPdf } from "../../lib/menuPdf";
import { downloadCompactMenuPdf } from "../../lib/menuPdfCompact";
import { Button } from "../../components/ui/button";
import { Input, Label, Textarea } from "../../components/ui/input";
import { QrDownload } from "../../components/QrDownload";
import type { Category, Dish, PdfQrSize, Restaurant } from "../../types";

export function RestaurantInfoTab({
  restaurant,
  categories,
  dishes,
  onChanged,
}: {
  restaurant: Restaurant;
  categories: Category[];
  dishes: Dish[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    tagline: restaurant.tagline ?? "",
    address: restaurant.address ?? "",
    hours: restaurant.hours ?? "",
    phone: restaurant.phone ?? "",
    footer_text: restaurant.footer_text ?? "",
    pdf_qr_enabled: restaurant.pdf_qr_enabled,
    pdf_qr_size: restaurant.pdf_qr_size,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<"large" | "compact" | null>(null);

  async function handleDownloadPdf() {
    setGeneratingPdf("large");
    try {
      await downloadMenuPdf(restaurant, categories, dishes);
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function handleDownloadCompactPdf() {
    setGeneratingPdf("compact");
    try {
      await downloadCompactMenuPdf(restaurant, categories, dishes);
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function save() {
    setSaving(true);
    await supabase.from("restaurants").update(form).eq("id", restaurant.id);
    setSaving(false);
    onChanged();
  }

  async function handleLogo(file: File) {
    setUploadingLogo(true);
    const path = `${restaurant.id}/logo-${Date.now()}.${fileExtension(file)}`;
    const { error } = await supabase.storage
      .from("restaurant-assets")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("restaurant-assets").getPublicUrl(path);
      await supabase.from("restaurants").update({ logo_url: data.publicUrl }).eq("id", restaurant.id);
      onChanged();
    }
    setUploadingLogo(false);
  }

  const menuUrl = appUrl(restaurant.slug);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="w-full max-w-lg space-y-3 rounded-2xl border border-black/10 bg-white p-5 min-w-0">
        <div className="flex items-center gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-neutral-100" />
          )}
          <label className="cursor-pointer text-sm text-[var(--color-accent)] underline">
            {uploadingLogo ? "Subiendo…" : "Cambiar logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => e.target.files && handleLogo(e.target.files[0])}
            />
          </label>
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        </div>
        <div>
          <Label>Dirección</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <Label>Horario</Label>
          <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <Label>Texto del pie de página</Label>
          <Textarea rows={2} value={form.footer_text} onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))} />
        </div>
        <div className="rounded-lg border border-black/10 p-3">
          <Label>Código QR en la carta impresa (PDF)</Label>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pdf_qr_enabled}
              onChange={(e) => setForm((f) => ({ ...f, pdf_qr_enabled: e.target.checked }))}
            />
            Mostrar código QR
          </label>
          {form.pdf_qr_enabled && (
            <select
              className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              value={form.pdf_qr_size}
              onChange={(e) => setForm((f) => ({ ...f, pdf_qr_size: e.target.value as PdfQrSize }))}
            >
              <option value="pequeno">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          )}
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-4 rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="font-semibold">Tu carta para imprimir</h3>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 rounded-md border border-neutral-200 bg-white p-2 shadow-sm">
              <div className="mx-auto mb-1.5 h-1.5 w-3/4 rounded-sm bg-neutral-800" />
              <div className="mx-auto mb-2 h-1 w-1/2 rounded-sm bg-neutral-300" />
              <div className="mb-1 h-1 w-1/3 rounded-sm bg-neutral-400" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="mb-1 flex items-center justify-between">
                  <div className="h-0.5 w-3/5 rounded-sm bg-neutral-200" />
                  <div className="h-0.5 w-1/6 rounded-sm bg-neutral-300" />
                </div>
              ))}
              <div className="mb-1 mt-2 h-1 w-2/5 rounded-sm bg-neutral-400" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="mb-1 flex items-center justify-between">
                  <div className="h-0.5 w-3/5 rounded-sm bg-neutral-200" />
                  <div className="h-0.5 w-1/6 rounded-sm bg-neutral-300" />
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-neutral-500">
              Carta grande
              <br />
              <span className="text-neutral-400">1 columna, más espaciosa</span>
            </p>
            <Button size="sm" onClick={handleDownloadPdf} disabled={generatingPdf !== null}>
              {generatingPdf === "large" ? "Generando…" : "Descargar carta grande"}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-28 rounded-md border border-neutral-200 bg-white p-2 shadow-sm">
              <div className="mx-auto mb-1.5 h-1.5 w-3/4 rounded-sm bg-neutral-800" />
              <div className="mx-auto mb-2 h-1 w-1/2 rounded-sm bg-neutral-300" />
              <div className="flex gap-1.5">
                {[0, 1].map((col) => (
                  <div key={col} className="flex-1">
                    <div className="mb-0.5 h-0.5 w-1/3 rounded-sm bg-neutral-400" />
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="mb-0.5 flex items-center justify-between">
                        <div className="h-0.5 w-3/5 rounded-sm bg-neutral-200" />
                        <div className="h-0.5 w-1/6 rounded-sm bg-neutral-300" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-neutral-500">
              Carta pequeña
              <br />
              <span className="text-neutral-400">2 columnas, compacta</span>
            </p>
            <Button size="sm" onClick={handleDownloadCompactPdf} disabled={generatingPdf !== null}>
              {generatingPdf === "compact" ? "Generando…" : "Descargar carta pequeña"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="font-semibold">Tu código QR</h3>
        <p className="max-w-full break-all text-center text-xs text-neutral-500">
          Descárgalo e imprímelo en tus mesas. Apunta a tu carta:
          <br />
          <span className="font-mono">{menuUrl}</span>
        </p>
        <QrDownload url={menuUrl} logoUrl={restaurant.logo_url} fileName={restaurant.slug} />
      </div>
    </div>
  );
}
