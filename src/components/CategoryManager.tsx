import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Category, Dish } from "../types";

export function CategoryManager({
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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    const nextSortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1) + 1;
    await supabase.from("categories").insert({
      restaurant_id: restaurantId,
      name: newCategoryName.trim(),
      sort_order: nextSortOrder,
    });
    setNewCategoryName("");
    setCreatingCategory(false);
    onChanged();
  }

  function startEditCategory(c: Category) {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
  }

  async function saveEditCategory() {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    await supabase
      .from("categories")
      .update({ name: editingCategoryName.trim() })
      .eq("id", editingCategoryId);
    setEditingCategoryId(null);
    onChanged();
  }

  async function deleteCategory(c: Category) {
    const dishCount = dishes.filter((d) => d.category_id === c.id).length;
    if (dishCount > 0) {
      alert(`No se puede borrar "${c.name}": tiene ${dishCount} plato(s). Muévelos o bórralos primero.`);
      return;
    }
    if (!confirm(`¿Borrar la categoría "${c.name}"?`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
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
