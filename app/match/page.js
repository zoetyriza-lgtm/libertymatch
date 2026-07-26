"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function MatchPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [misIntereses, setMisIntereses] = useState([]);
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) {
      router.push("/login");
      return;
    }
    const usuarioId = sesion.session.user.id;

    const { data: miPerfil } = await supabase
      .from("profiles")
      .select("intereses")
      .eq("id", usuarioId)
      .single();

    const propios = miPerfil?.intereses || [];
    setMisIntereses(propios);

    const { data: otros } = await supabase.from("profiles").select("*").neq("id", usuarioId);

    // Calculamos afinidad: cuántos intereses tenemos en común con cada persona
    const conPuntaje = (otros || [])
      .map((p) => {
        const compartidos = (p.intereses || []).filter((i) => propios.includes(i));
        return { ...p, compartidos };
      })
      .sort((a, b) => b.compartidos.length - a.compartidos.length);

    setPersonas(conPuntaje);
    setCargando(false);
  }

  if (cargando) return <p className="text-ink/60 not-italic">Buscando personas afines...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Encuentra tu match</h1>
      <p className="text-sm text-ink/60 mb-6 not-italic">
        Estudiantes del campus con intereses parecidos a los tuyos.
      </p>

      {misIntereses.length === 0 && (
        <div className="pin-card rounded-2xl p-6 mb-6">
          <div className="pin-dot" />
          <p className="text-sm not-italic">
            Aún no tienes intereses guardados, así que por ahora te mostramos a todo el mundo sin
            ordenar. Ve a tu{" "}
            <Link href="/perfil" className="underline font-medium">
              perfil
            </Link>{" "}
            y agrégalos para encontrar mejores matches.
          </p>
        </div>
      )}

      {personas.length === 0 && (
        <p className="text-sm text-ink/60 not-italic">Todavía no hay más estudiantes registrados.</p>
      )}

      {personas.map((p) => (
        <div key={p.id} className="pin-card rounded-2xl shadow-pin p-5 mb-4 flex items-center gap-4">
          <div className="pin-dot" />
          <div className="w-14 h-14 rounded-full overflow-hidden bg-board border border-ink/10 shrink-0 flex items-center justify-center">
            {p.foto_url ? (
              <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-ink/30 not-italic">{p.nombre?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl">{p.nombre}</h3>
            {p.bio && <p className="text-sm text-ink/70 not-italic">{p.bio}</p>}
            {p.compartidos.length > 0 ? (
              <p className="text-xs text-moss font-medium mt-1 not-italic">
                {p.compartidos.length} interés{p.compartidos.length > 1 ? "es" : ""} en común:{" "}
                {p.compartidos.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-ink/40 mt-1 not-italic">Sin intereses en común todavía</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
