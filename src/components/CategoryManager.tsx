import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Category } from "../types";

export function CategoryManager({
  restaurantId,
  categories,
  onChanged,
}: {
  restaurantId: string;
  categories: Category[];
  onChanged: () => void;
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name || creatingCategory) return;

    setCreatingCategory(true);
    setFormError(null);

    const { data: maxRow } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { error } = await supabase.from("categories").insert({
      restaurant_id: restaurantId,
      name,
      sort_order: nextSortOrder,
    });

    setCreatingCategory(false);
    if (error) {
      setFormError("No se pudo crear la categoría. Inténtalo de nuevo.");
      return;
    }
    setNewCategoryName("");
    onChanged();
  }

  function startEditCategory(c: Category) {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
    setFormError(null);
  }

  async function saveEditCategory() {
    const name = editingCategoryName.trim();
    if (!editingCategoryId || !name) return;

    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", editingCategoryId);

    if (error) {
      setFormError("No se pudo renombrar la categoría.");
      return;
    }
    setEditingCategoryId(null);
    onChanged();
  }

  async function deleteCategory(c: Category) {
    setFormError(null);
    const { count, error: countError } = await supabase
      .from("dishes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", c.id);

    if (countError) {
      setFormError("No se pudo comprobar la categoría antes de borrarla.");
      return;
    }
    if ((count ?? 0) > 0) {
      alert(`No se puede borrar "${c.name}": tiene ${count} plato(s). Muévelos o bórralos primero.`);
      return;
    }
    if (!confirm(`¿Borrar la categoría "${c.name}"?`)) return;

    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      setFormError("No se pudo borrar la categoría.");
      return;
    }
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="mb-3 font-semibold">Categorías</h3>
      {categories.length > 0 && (
        <div className="mb-3 space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              {editingCategoryId === c.id ? (
                <>
                  <Input
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={saveEditCategory}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingCategoryId(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => startEditCategory(c)}>
                    Renombrar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategory(c)}>
                    Borrar
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
      <form onSubmit={addCategory} className="flex gap-2">
        <Input
          placeholder="Nueva categoría (ej. Postres)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={creatingCategory}>
          {creatingCategory ? "Añadiendo…" : "Añadir categoría"}
        </Button>
      </form>
    </div>
  );
}
