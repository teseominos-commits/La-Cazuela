import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { applyTheme } from "../themes";
import { DishCard } from "../components/DishCard";
import { AllergenLegend } from "../components/AllergenIcon";
import { COMMON_ALLERGENS, ALLERGEN_LABELS } from "../types";
import type { AllergenCode, Category, DailyMenu, Dish, Restaurant } from "../types";

function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + " €";
}

type DietFilter = "vegano" | "vegetariano";

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "not-found" | "error"
  >("loading");
  const [dietFilters, setDietFilters] = useState<Set<DietFilter>>(new Set());
  const [excludedAllergens, setExcludedAllergens] = useState<Set<AllergenCode>>(new Set());

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadOnce() {
      const { data: r, error: rErr } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (rErr) throw rErr;

      if (!r) {
        if (!cancelled) setStatus("not-found");
        return;
      }
      if (cancelled) return;

      setRestaurant(r as Restaurant);
      applyTheme(r.theme);
      document.title = `${r.name} — Carta digital`;

      const [
        { data: cats, error: catsErr },
        { data: ds, error: dsErr },
        { data: dm, error: dmErr },
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", r.id)
          .order("sort_order"),
        supabase
          .from("dishes")
          .select("*")
          .eq("restaurant_id", r.id)
          .order("sort_order"),
        supabase
          .from("daily_menus")
          .select("*")
          .eq("restaurant_id", r.id)
          .maybeSingle(),
      ]);
      if (catsErr || dsErr || dmErr) throw catsErr ?? dsErr ?? dmErr;

      if (cancelled) return;
      setCategories((cats as Category[]) ?? []);
      setDishes((ds as Dish[]) ?? []);
      setDailyMenu((dm as DailyMenu) ?? null);
      setActiveCategory(cats && cats.length > 0 ? cats[0].id : null);
      setStatus("ready");

      supabase.rpc("increment_visit", { p_slug: slug }).then(() => {});
    }

    async function load(retriesLeft = 1) {
      try {
        await loadOnce();
      } catch (err) {
        if (cancelled) return;
        if (retriesLeft > 0) {
          load(retriesLeft - 1);
        } else {
          console.error("No se pudo cargar la carta:", err);
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const hasActiveFilters = dietFilters.size > 0 || excludedAllergens.size > 0;

  const filteredDishes = useMemo(() => {
    if (!hasActiveFilters) return dishes;
    return dishes.filter((d) => {
      if (dietFilters.has("vegano") && !d.is_vegan) return false;
      if (dietFilters.has("vegetariano") && !d.is_vegetarian) return false;
      for (const code of excludedAllergens) {
        if (d.allergens.includes(code)) return false;
      }
      return true;
    });
  }, [dishes, dietFilters, excludedAllergens, hasActiveFilters]);

  const dishesByCategory = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const d of filteredDishes) {
      const list = map.get(d.category_id) ?? [];
      list.push(d);
      map.set(d.category_id, list);
    }
    return map;
  }, [filteredDishes]);

  const visibleCategories = useMemo(() => {
    if (!hasActiveFilters) return categories;
    return categories.filter((c) => (dishesByCategory.get(c.id)?.length ?? 0) > 0);
  }, [categories, dishesByCategory, hasActiveFilters]);

  const allAllergensUsed = useMemo(() => {
    const set = new Set<AllergenCode>();
    dishes.forEach((d) => d.allergens.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [dishes]);

  function toggleDietFilter(filter: DietFilter) {
    setDietFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  function toggleExcludedAllergen(code: AllergenCode) {
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function clearFilters() {
    setDietFilters(new Set());
    setExcludedAllergens(new Set());
  }

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-soft)]">
        Cargando la carta…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-[var(--color-text-soft)]">
        <p>No se ha podido cargar la carta. Comprueba tu conexión.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-neutral-800 px-4 py-2 text-sm text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (status === "not-found" || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-[var(--color-text-soft)]">
        No hemos encontrado esta carta. Comprueba el enlace o el código QR.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)" }} className="min-h-screen pb-10">
      <header
        className="px-5 pb-6 pt-9 text-center text-white"
        style={{
          background: `linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))`,
        }}
      >
        {restaurant.logo_url && (
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="mx-auto mb-3 h-14 w-14 rounded-full object-cover ring-2 ring-white/40"
          />
        )}
        <h1 className="font-display text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.tagline && (
          <p className="mt-1 text-sm opacity-90">{restaurant.tagline}</p>
        )}
      </header>

      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto px-4 py-3" style={{ background: "var(--color-bg)" }}>
        {visibleCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => scrollToCategory(c.id)}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors"
            style={
              activeCategory === c.id
                ? { background: "var(--color-accent-2)", color: "white" }
                : { background: "var(--color-surface)", color: "var(--color-text)" }
            }
          >
            {c.name}
          </button>
        ))}
      </nav>

      <details className="mx-4 mb-4 rounded-2xl px-4 py-2 text-sm" style={{ background: "var(--color-surface)" }}>
        <summary className="cursor-pointer select-none font-semibold" style={{ color: "var(--color-text)" }}>
          Filtrar por dieta y alérgenos
          {hasActiveFilters && (
            <span className="ml-2 font-normal text-[var(--color-text-soft)]">
              ({dietFilters.size + excludedAllergens.size} activo{dietFilters.size + excludedAllergens.size === 1 ? "" : "s"})
            </span>
          )}
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["vegano", "vegetariano"] as DietFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => toggleDietFilter(filter)}
                className="rounded-full px-3 py-1 text-xs font-semibold capitalize shadow-sm transition-colors"
                style={
                  dietFilters.has(filter)
                    ? { background: "var(--color-accent-2)", color: "white" }
                    : { background: "var(--color-bg)", color: "var(--color-text)" }
                }
              >
                {filter}
              </button>
            ))}
          </div>
          <div>
            <p className="mb-1.5 text-xs text-[var(--color-text-soft)]">Ocultar platos con:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((code) => (
                <button
                  key={code}
                  onClick={() => toggleExcludedAllergen(code)}
                  className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors"
                  style={
                    excludedAllergens.has(code)
                      ? { background: "var(--color-accent-2)", color: "white" }
                      : { background: "var(--color-bg)", color: "var(--color-text)" }
                  }
                >
                  {ALLERGEN_LABELS[code]}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold underline text-[var(--color-text-soft)]"
            >
              Quitar filtros
            </button>
          )}
        </div>
      </details>

      {dailyMenu?.enabled && (
        <div
          className="mx-4 mb-6 rounded-2xl p-5 text-white"
          style={{ background: "var(--color-accent)" }}
        >
          <h2 className="font-display text-lg font-bold">
            {dailyMenu.title ?? "Menú del día"}
            {dailyMenu.price != null && <> — {formatPrice(dailyMenu.price)}</>}
          </h2>
          <ul className="mt-2 space-y-0.5 text-sm opacity-95">
            {dailyMenu.first_course && <li>{dailyMenu.first_course}</li>}
            {dailyMenu.second_course && <li>{dailyMenu.second_course}</li>}
            {dailyMenu.dessert && <li>{dailyMenu.dessert}</li>}
          </ul>
          {dailyMenu.includes && (
            <p className="mt-2 text-xs opacity-90">Incluye: {dailyMenu.includes}</p>
          )}
          {dailyMenu.note && (
            <p className="mt-1 text-xs italic opacity-80">{dailyMenu.note}</p>
          )}
        </div>
      )}

      <main className="mx-auto max-w-xl px-4">
        {hasActiveFilters && visibleCategories.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-text-soft)]">
            No hay platos que cumplan este filtro.
          </p>
        ) : (
          visibleCategories.map((c) => (
            <section key={c.id} id={`cat-${c.id}`} className="mb-8 scroll-mt-16">
              <h2
                className="font-display mb-3 border-b pb-2 text-xl font-bold"
                style={{ borderColor: "rgba(0,0,0,0.08)", color: "var(--color-accent-dark)" }}
              >
                {c.name}
              </h2>
              <div className="space-y-3">
                {(dishesByCategory.get(c.id) ?? []).map((d) => (
                  <DishCard key={d.id} dish={d} />
                ))}
              </div>
            </section>
          ))
        )}
        <AllergenLegend codes={allAllergensUsed} />
      </main>

      <footer className="mt-6 px-5 text-center text-sm text-[var(--color-text-soft)]">
        {restaurant.address && <p>{restaurant.address}</p>}
        {restaurant.hours && <p className="mt-1">{restaurant.hours}</p>}
        {restaurant.phone && (
          <p className="mt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address ?? restaurant.name)}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {restaurant.phone} · Cómo llegar
            </a>
          </p>
        )}
        {restaurant.footer_text && (
          <p className="mx-auto mt-3 max-w-sm text-xs opacity-80">{restaurant.footer_text}</p>
        )}
      </footer>
    </div>
  );
}
