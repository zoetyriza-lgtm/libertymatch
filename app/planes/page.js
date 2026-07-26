"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import PlanCard from "../../components/PlanCard";

export default function PlanesPage() {
  const [planes, setPlanes] = useState([]);
  const [conteos, setConteos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtroActividad, setFiltroActividad] = useState("");
  const [soloFuturos, setSoloFuturos] = useState(true);

  useEffect(() => {
    cargarPlanes();
  }, []);

  async function cargarPlanes() {
    setCargando(true);

    const { data: planesData } = await supabase
      .from("planes")
      .select("*")
      .neq("estado", "cancelado")
      .order("fecha", { ascending: true });

    const lista = planesData || [];
    setPlanes(lista);

    if (lista.length > 0) {
      const { data: inscripciones } = await supabase
        .from("inscripciones")
        .select("plan_id")
        .in("plan_id", lista.map((p) => p.id));

      const mapa = {};
      (inscripciones || []).forEach((i) => {
        mapa[i.plan_id] = (mapa[i.plan_id] || 0) + 1;
      });
      setConteos(mapa);
    }

    setCargando(false);
  }

  const planesFiltrados = planes.filter((p) => {
    if (soloFuturos && new Date(p.fecha) < new Date()) return false;
    if (filtroActividad && !p.actividad.toLowerCase().includes(filtroActividad.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Planes en el campus</h1>
        <Link
          href="/planes/crear"
          className="bg-clay text-paper px-4 py-2 rounded-full text-sm font-semibold hover:bg-ink transition-colors"
        >
          + Nuevo plan
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar actividad (ej. correr, estudiar...)"
          value={filtroActividad}
          onChange={(e) => setFiltroActividad(e.target.value)}
          className="border border-ink/20 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px] bg-paper focus:outline-none focus:ring-2 focus:ring-mustard"
        />
        <label className="flex items-center gap-2 text-sm bg-paper border border-ink/20 rounded-lg px-3 py-2">
          <input
            type="checkbox"
            checked={soloFuturos}
            onChange={(e) => setSoloFuturos(e.target.checked)}
          />
          Solo próximos
        </label>
      </div>

      {cargando && <p className="text-ink/60">Cargando planes...</p>}

      {!cargando && planesFiltrados.length === 0 && (
        <div className="pin-card rounded-xl p-8 text-center">
          <div className="pin-dot" />
          <p className="text-ink/70">No hay planes que coincidan. ¿Por qué no publicas el primero?</p>
        </div>
      )}

      {!cargando &&
        planesFiltrados.map((plan) => (
          <PlanCard key={plan.id} plan={plan} inscritosCount={conteos[plan.id] || 0} />
        ))}
    </div>
  );
}
