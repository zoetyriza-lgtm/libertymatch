"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function ExperienciasPage() {
  const [experiencias, setExperiencias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("experiencias")
      .select("*, profiles(nombre, foto_url), planes(actividad)")
      .order("created_at", { ascending: false });
    setExperiencias(data || []);
    setCargando(false);
  }

  function formatear(fechaISO) {
    return new Date(fechaISO).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Experiencias</h1>
          <p className="text-sm text-ink/60 not-italic">Lo que ha vivido el campus en LibertyMatch.</p>
        </div>
        <Link
          href="/experiencias/crear"
          className="bg-clay text-paper px-4 py-2 rounded-full text-sm font-medium not-italic hover:opacity-90 transition-all hover:-translate-y-0.5 shrink-0"
        >
          + Compartir
        </Link>
      </div>

      {cargando && <p className="text-ink/60 not-italic">Cargando...</p>}

      {!cargando && experiencias.length === 0 && (
        <div className="pin-card rounded-2xl p-8 text-center">
          <div className="pin-dot" />
          <p className="text-ink/70 not-italic">Nadie ha compartido su experiencia todavía. ¡Sé el primero!</p>
        </div>
      )}

      {experiencias.map((exp) => (
        <article key={exp.id} className="pin-card rounded-2xl shadow-pin p-6 mb-5">
          <div className="pin-dot" />
          {exp.foto_url && (
            <img
              src={exp.foto_url}
              alt={exp.titulo}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          <h2 className="font-display text-2xl mb-1">{exp.titulo}</h2>
          <p className="text-xs text-ink/50 mb-3 not-italic">
            {exp.profiles?.nombre || "Estudiante"} · {formatear(exp.created_at)}
            {exp.planes?.actividad && <> · sobre "{exp.planes.actividad}"</>}
          </p>
          <p className="text-sm text-ink/80 whitespace-pre-line not-italic">{exp.contenido}</p>
        </article>
      ))}
    </div>
  );
}
