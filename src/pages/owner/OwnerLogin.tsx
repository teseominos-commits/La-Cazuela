import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/input";

export default function OwnerLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/panel` },
    });
    setLoading(false);
    if (error) {
      setError("No hemos podido enviar el enlace. Inténtalo de nuevo.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFBF5] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-neutral-900">
          Panel del restaurante
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Introduce tu correo y te enviamos un enlace de acceso, sin contraseñas.
        </p>

        {sent ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            Te hemos enviado un enlace a <strong>{email}</strong>. Ábrelo desde tu
            correo para entrar al panel.
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
                placeholder="tu@restaurante.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando…" : "Enviarme el enlace de acceso"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
