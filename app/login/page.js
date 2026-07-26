"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);

    if (loginError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/planes");
  }

  return (
    <div className="pin-card rounded-xl shadow-pin p-8 max-w-md mx-auto">
      <div className="pin-dot" />
      <h1 className="font-display text-3xl mb-1">Bienvenido de vuelta</h1>
      <p className="text-sm text-ink/60 mb-6">Inicia sesión para ver los planes del campus.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-ink text-paper py-2.5 rounded-lg font-semibold hover:bg-moss transition-colors disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-5">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-clay font-medium">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
