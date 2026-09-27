import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { appUrl } from "../../lib/url";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/input";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: appUrl("admin") },
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Panel de vendedor</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acceso restringido. Introduce tu correo para recibir el enlace.
        </p>
        {sent ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            Enlace enviado a {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando…" : "Enviarme el enlace"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
