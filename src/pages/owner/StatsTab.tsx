import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function StatsTab({ restaurantId }: { restaurantId: string }) {
  const [total30, setTotal30] = useState<number | null>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: recent } = await supabase
        .from("visit_counts")
        .select("count")
        .eq("restaurant_id", restaurantId)
        .gte("day", since.toISOString().slice(0, 10));
      const { data: all } = await supabase
        .from("visit_counts")
        .select("count")
        .eq("restaurant_id", restaurantId);
      setTotal30((recent ?? []).reduce((s, r) => s + r.count, 0));
      setTotalAll((all ?? []).reduce((s, r) => s + r.count, 0));
    }
    load();
  }, [restaurantId]);

  return (
    <div className="grid max-w-md grid-cols-2 gap-4">
      <div className="rounded-2xl border border-black/10 bg-white p-5 text-center">
        <p className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
          {total30 ?? "…"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">Visitas últimos 30 días</p>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-5 text-center">
        <p className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
          {totalAll ?? "…"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">Visitas totales</p>
      </div>
    </div>
  );
}
