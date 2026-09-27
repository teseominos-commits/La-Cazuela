import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { appUrl } from "../../lib/url";
import { Button } from "../../components/ui/button";
import { Input, Label, Textarea } from "../../components/ui/input";
import { QrDownload } from "../../components/QrDownload";
import type { Restaurant } from "../../types";

export function RestaurantInfoTab({
  restaurant,
  onChanged,
}: {
  restaurant: Restaurant;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    tagline: restaurant.tagline ?? "",
    address: restaurant.address ?? "",
    hours: restaurant.hours ?? "",
    phone: restaurant.phone ?? "",
    footer_text: restaurant.footer_text ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from("restaurants").update(form).eq("id", restaurant.id);
    setSaving(false);
    onChanged();
  }

  async function handleLogo(file: File) {
    setUploadingLogo(true);
    const path = `${restaurant.id}/logo-${Date.now()}.jpg`;
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="max-w-lg space-y-3 rounded-2xl border border-black/10 bg-white p-5">
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
              accept="image/*"
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
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="font-semibold">Tu código QR</h3>
        <p className="text-center text-xs text-neutral-500">
          Descárgalo e imprímelo en tus mesas. Apunta a tu carta:
          <br />
          <span className="font-mono">{menuUrl}</span>
        </p>
        <QrDownload url={menuUrl} logoUrl={restaurant.logo_url} fileName={restaurant.slug} />
      </div>
    </div>
  );
}
