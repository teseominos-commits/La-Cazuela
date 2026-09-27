import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { fileExtension } from "../../lib/files";
import { Button } from "../../components/ui/button";
import { Input, Label, Textarea } from "../../components/ui/input";
import { AllergenIcon } from "../../components/AllergenIcon";
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  COMMON_ALLERGENS,
  type AllergenCode,
  type Category,
  type Dish,
} from "../../types";

const emptyForm = {
  id: null as string | null,
  category_id: "",
  name: "",
  description: "",
  price: "",
  price_note: "",
  is_vegetarian: false,
  is_vegan: false,
  allergens: [] as AllergenCode[],
};

export function DishesTab({
  restaurantId,
  categories,
  dishes,
  onChanged,
}: {
  restaurantId: string;
  categories: Category[];
  dishes: Dish[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [showMoreAllergens, setShowMoreAllergens] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function startEdit(d: Dish) {
    setForm({
      id: d.id,
      category_id: d.category_id,
      name: d.name,
      description: d.description ?? "",
      price: String(d.price),
      price_note: d.price_note ?? "",
      is_vegetarian: d.is_vegetarian,
      is_vegan: d.is_vegan,
      allergens: d.allergens,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleAllergen(code: AllergenCode) {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(code)
        ? f.allergens.filter((a) => a !== code)
        : [...f.allergens, code],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id || !form.name || !form.price) return;
    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      category_id: form.category_id,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      price_note: form.price_note || null,
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      allergens: form.allergens,
    };
    if (form.id) {
      await supabase.from("dishes").update(payload).eq("id", form.id);
    } else {
      await supabase.from("dishes").insert(payload);
    }
    setSaving(false);
    setForm(emptyForm);
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este plato?")) return;
    await supabase.from("dishes").delete().eq("id", id);
    onChanged();
  }

  async function toggleSoldOut(d: Dish) {
    await supabase
      .from("dishes")
      .update({ is_sold_out: !d.is_sold_out })
      .eq("id", d.id);
    onChanged();
  }

  async function handlePhoto(d: Dish, file: File) {
    setUploadingId(d.id);
    const path = `${restaurantId}/dishes/${d.id}-${Date.now()}.${fileExtension(file)}`;
    const { error } = await supabase.storage
      .from("restaurant-assets")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("restaurant-assets").getPublicUrl(path);
      await supabase.from("dishes").update({ photo_url: data.publicUrl }).eq("id", d.id);
      onChanged();
    }
    setUploadingId(null);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="mb-3 font-semibold">
          {form.id ? "Editar plato" : "Añadir plato"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Categoría</Label>
            <select
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              required
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nombre del plato</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Precio (€)</Label>
            <Input
              type="number"
              step="0.10"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Nota de precio (opcional, ej. "mín. 2 personas")</Label>
            <Input
              value={form.price_note}
              onChange={(e) => setForm((f) => ({ ...f, price_note: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Descripción (1 línea)</Label>
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_vegetarian}
              onChange={(e) => setForm((f) => ({ ...f, is_vegetarian: e.target.checked }))}
            />
            Vegetariano
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_vegan}
              onChange={(e) => setForm((f) => ({ ...f, is_vegan: e.target.checked }))}
            />
            Vegano
          </label>
        </div>
        <div className="mt-3">
          <Label>Alérgenos</Label>
          <div className="flex flex-wrap gap-3 text-sm">
            {COMMON_ALLERGENS.map((code) => (
              <label key={code} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={form.allergens.includes(code)}
                  onChange={() => toggleAllergen(code)}
                />
                {ALLERGEN_LABELS[code]}
              </label>
            ))}
          </div>
          {!showMoreAllergens ? (
            <button
              type="button"
              onClick={() => setShowMoreAllergens(true)}
              className="mt-1 text-xs text-[var(--color-accent)] underline"
            >
              + más alérgenos
            </button>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {ALLERGEN_CODES.filter((c) => !COMMON_ALLERGENS.includes(c)).map((code) => (
                <label key={code} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.allergens.includes(code)}
                    onChange={() => toggleAllergen(code)}
                  />
                  {ALLERGEN_LABELS[code]}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Añadir plato"}
          </Button>
          {form.id && (
            <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {dishes.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-black/10 bg-white p-3"
          >
            <div className="flex items-start gap-3">
              {d.photo_url ? (
                <img src={d.photo_url} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-neutral-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-neutral-500">{d.price.toFixed(2)} €</p>
                {d.allergens.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.allergens.map((a) => (
                      <AllergenIcon key={a} code={a} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer text-xs text-[var(--color-accent)] underline">
                {uploadingId === d.id ? "Subiendo…" : "Foto"}
                <input
                  type="file"
                  accept="image/*,.svg,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handlePhoto(d, e.target.files[0])}
                />
              </label>
              <Button size="sm" variant={d.is_sold_out ? "danger" : "secondary"} onClick={() => toggleSoldOut(d)}>
                {d.is_sold_out ? "Agotado" : "Disponible"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => startEdit(d)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}>
                Borrar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
