"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import PlanCard from "../../components/PlanCard";

export default function MisPlanesPage() {
  const router = useRouter();
  const [creados, setCreados] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [conteos, setConteos] = useState({});
  const [cargando, setCargando] = useState(true);

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

    const { data: planesCreados } = await supabase
      .from("planes")
      .select("*")
      .eq("creador_id", usuarioId)
      .order("fecha", { ascending: true });

    const { data: misInscripciones } = await supabase
      .from("inscripciones")
      .select("plan_id, planes(*)")
      .eq("usuario_id", usuarioId);

    const planesInscritos = (misInscripciones || [])
      .map((i) => i.planes)
      .filter((p) => p && p.creador_id !== usuarioId);

    setCreados(planesCreados || []);
    setInscritos(planesInscritos);

    const todosIds = [...(planesCreados || []), ...planesInscritos].map((p) => p.id);
    if (todosIds.length > 0) {
      const { data: todasInscripciones } = await supabase
        .from("inscripciones")
        .select("plan_id")
        .in("plan_id", todosIds);
      const mapa = {};
      (todasInscripciones || []).forEach((i) => {
        mapa[i.plan_id] = (mapa[i.plan_id] || 0) + 1;
      });
      setConteos(mapa);
    }

    setCargando(false);
  }

  if (cargando) return <p className="text-ink/60">Cargando tus planes...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Mis planes</h1>

      <h2 className="font-display text-xl mb-3">Que creé</h2>
      {creados.length === 0 && <p className="text-sm text-ink/60 mb-6">Aún no has creado ningún plan.</p>}
      {creados.map((plan) => (
        <PlanCard key={plan.id} plan={plan} inscritosCount={conteos[plan.id] || 0} />
      ))}

      <h2 className="font-display text-xl mb-3 mt-8">En los que estoy inscrito</h2>
      {inscritos.length === 0 && <p className="text-sm text-ink/60">No estás inscrito en ningún plan aún.</p>}
      {inscritos.map((plan) => (
        <PlanCard key={plan.id} plan={plan} inscritosCount={conteos[plan.id] || 0} />
      ))}
    </div>
  );
}
