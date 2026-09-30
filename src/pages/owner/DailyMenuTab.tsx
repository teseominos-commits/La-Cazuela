import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/input";
import type { DailyMenu } from "../../types";

export function DailyMenuTab({
  restaurantId,
  dailyMenu,
  onChanged,
}: {
  restaurantId: string;
  dailyMenu: DailyMenu | null;
  onChanged: () => void;
}) {
  const [form, setForm] = useState<DailyMenu>(
    dailyMenu ?? {
      restaurant_id: restaurantId,
      enabled: false,
      title: "Menú del día",
      price: null,
      first_course: "",
      second_course: "",
      dessert: "",
      includes: "",
      note: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setFormError(null);
    const { error } = await supabase.from("daily_menus").upsert({ ...form, restaurant_id: restaurantId });
    setSaving(false);
    if (error) {
      setFormError("No se pudo guardar el menú del día.");
      return;
    }
    onChanged();
  }

  return (
    <div className="max-w-lg space-y-3 rounded-2xl border border-black/10 bg-white p-5">
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
        />
        Mostrar menú del día en la carta
      </label>
      <div>
        <Label>Título</Label>
        <Input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div>
        <Label>Precio (€)</Label>
        <Input
          type="number"
          step="0.10"
          value={form.price ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
        />
      </div>
      <div>
        <Label>Primer plato</Label>
        <Input value={form.first_course ?? ""} onChange={(e) => setForm((f) => ({ ...f, first_course: e.target.value }))} />
      </div>
      <div>
        <Label>Segundo plato</Label>
        <Input value={form.second_course ?? ""} onChange={(e) => setForm((f) => ({ ...f, second_course: e.target.value }))} />
      </div>
      <div>
        <Label>Postre</Label>
        <Input value={form.dessert ?? ""} onChange={(e) => setForm((f) => ({ ...f, dessert: e.target.value }))} />
      </div>
      <div>
        <Label>Incluye</Label>
        <Input value={form.includes ?? ""} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} />
      </div>
      <div>
        <Label>Nota / condiciones</Label>
        <Input value={form.note ?? ""} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar menú del día"}
      </Button>
    </div>
  );
}
