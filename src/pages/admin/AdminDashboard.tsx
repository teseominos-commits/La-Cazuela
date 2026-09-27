import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/input";
import { THEMES } from "../../themes";
import type { Restaurant, ThemeKey } from "../../types";
import AdminLogin from "./AdminLogin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visits, setVisits] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: "", owner_email: "", theme: "mediterraneo_calido" as ThemeKey });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    const { data: admin } = await supabase.from("platform_admins").select("user_id").maybeSingle();
    setIsAdmin(!!admin);
    if (!admin) return;

    const { data: rs } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    setRestaurants((rs as Restaurant[]) ?? []);

    const { data: vc } = await supabase.from("visit_counts").select("restaurant_id, count");
    const totals: Record<string, number> = {};
    (vc ?? []).forEach((row) => {
      totals[row.restaurant_id] = (totals[row.restaurant_id] ?? 0) + row.count;
    });
    setVisits(totals);
  }, []);

  useEffect(() => {
    if (session?.user) load();
  }, [session, load]);

  if (session === undefined || (session && isAdmin === null)) return null;
  if (!session) return <AdminLogin />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-neutral-600">
        Esta cuenta no tiene acceso de administrador de la plataforma.
      </div>
    );
  }

  async function createRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const slug = slugify(form.name);
    await supabase.from("restaurants").insert({
      name: form.name,
      slug,
      theme: form.theme,
      owner_email: form.owner_email || null,
      status: "active",
      plan: "basico",
    });
    setForm({ name: "", owner_email: "", theme: "mediterraneo_calido" });
    setCreating(false);
    load();
  }

  async function togglePause(r: Restaurant) {
    await supabase
      .from("restaurants")
      .update({ status: r.status === "active" ? "paused" : "active" })
      .eq("id", r.id);
    load();
  }

  async function changeTheme(r: Restaurant, theme: ThemeKey) {
    await supabase.from("restaurants").update({ theme }).eq("id", r.id);
    load();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Panel de vendedor</h1>
        <Button variant="secondary" size="sm" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Button>
      </div>

      <form onSubmit={createRestaurant} className="mb-8 grid max-w-2xl gap-3 rounded-2xl border border-black/10 bg-white p-5 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label>Nombre del restaurante</Label>
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="sm:col-span-1">
          <Label>Correo del dueño</Label>
          <Input type="email" value={form.owner_email} onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))} />
        </div>
        <div className="sm:col-span-1">
          <Label>Tema de color</Label>
          <select
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            value={form.theme}
            onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value as ThemeKey }))}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={creating}>
            {creating ? "Creando…" : "Dar de alta restaurante"}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {restaurants.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
            <div className="min-w-[160px]">
              <p className="font-medium">{r.name}</p>
              <a
                href={`/${r.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--color-accent)] underline"
              >
                /{r.slug}
              </a>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {r.status === "active" ? "Activo" : "Pausado"}
            </span>
            <span className="text-xs text-neutral-500">Plan {r.plan}</span>
            <span className="text-xs text-neutral-500">{visits[r.id] ?? 0} visitas totales</span>
            <select
              className="rounded-lg border border-black/15 px-2 py-1 text-xs"
              value={r.theme}
              onChange={(e) => changeTheme(r, e.target.value as ThemeKey)}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant="secondary" className="ml-auto" onClick={() => togglePause(r)}>
              {r.status === "active" ? "Pausar" : "Reactivar"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-black/15 p-5 text-sm text-neutral-500">
        <strong>Facturación:</strong> disponible cuando actives el cobro por suscripción (fase 2, vía Stripe).
      </div>
    </div>
  );
}
