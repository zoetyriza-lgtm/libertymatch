"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (nombre.trim().length < 2) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    setCargando(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push("/planes");
  }

  return (
    <div className="pin-card rounded-xl shadow-pin p-8 max-w-md mx-auto">
      <div className="pin-dot" />
      <h1 className="font-display text-3xl mb-1">Crea tu cuenta</h1>
      <p className="text-sm text-ink/60 mb-6">Únete con tu correo del campus.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>
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
          {cargando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-5">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-clay font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
