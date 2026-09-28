import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import OwnerLogin from "./OwnerLogin";
import { DishesTab } from "./DishesTab";
import { DailyMenuTab } from "./DailyMenuTab";
import { RestaurantInfoTab } from "./RestaurantInfoTab";
import { StatsTab } from "./StatsTab";
import type { Category, DailyMenu, Dish, Restaurant } from "../../types";

type Tab = "platos" | "menu-dia" | "restaurante" | "estadisticas";

export default function OwnerDashboard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [tab, setTab] = useState<Tab>("platos");
  const [loadingData, setLoadingData] = useState(false);
  const [notLinked, setNotLinked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async (userId: string) => {
    setLoadingData(true);
    const { data: r } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (!r) {
      setNotLinked(true);
      setLoadingData(false);
      return;
    }
    setRestaurant(r as Restaurant);

    const [{ data: cats }, { data: ds }, { data: dm }] = await Promise.all([
      supabase.from("categories").select("*").eq("restaurant_id", r.id).order("sort_order"),
      supabase.from("dishes").select("*").eq("restaurant_id", r.id).order("sort_order"),
      supabase.from("daily_menus").select("*").eq("restaurant_id", r.id).maybeSingle(),
    ]);
    setCategories((cats as Category[]) ?? []);
    setDishes((ds as Dish[]) ?? []);
    setDailyMenu((dm as DailyMenu) ?? null);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (session?.user) loadData(session.user.id);
  }, [session, loadData]);

  if (session === undefined) return null;
  if (!session) return <OwnerLogin />;

  if (notLinked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-neutral-600">
        Tu cuenta todavía no está vinculada a ningún restaurante. Contacta con
        quien te dio de alta para que la asocie a tu carta.
      </div>
    );
  }

  if (loadingData || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-500">
        Cargando tu panel…
      </div>
    );
  }

  const refresh = () => loadData(session.user.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: "platos", label: "Platos" },
    { key: "menu-dia", label: "Menú del día" },
    { key: "restaurante", label: "Mi restaurante" },
    { key: "estadisticas", label: "Estadísticas" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <div>
          <h1 className="font-display text-lg font-bold">{restaurant.name}</h1>
          <p className="text-xs text-neutral-500">Panel de gestión</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-black/10 bg-white px-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${
              tab === t.key
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-neutral-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {tab === "platos" && (
          <DishesTab
            restaurantId={restaurant.id}
            categories={categories}
            dishes={dishes}
            onChanged={refresh}
          />
        )}
        {tab === "menu-dia" && (
          <DailyMenuTab restaurantId={restaurant.id} dailyMenu={dailyMenu} onChanged={refresh} />
        )}
        {tab === "restaurante" && (
          <RestaurantInfoTab
            restaurant={restaurant}
            categories={categories}
            dishes={dishes}
            onChanged={refresh}
          />
        )}
        {tab === "estadisticas" && <StatsTab restaurantId={restaurant.id} />}
      </main>
    </div>
  );
}
