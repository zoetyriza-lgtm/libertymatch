"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import SelectorEstrellas from "../../../components/SelectorEstrellas";

const MENSAJES = {
  ok: "",
  plan_no_existe: "Este plan ya no está disponible.",
  cupo_lleno: "Este plan ya alcanzó su cupo máximo.",
  ya_inscrito: "Ya estás inscrito en este plan.",
  no_inscrito: "No estabas inscrito en este plan.",
};

export default function DetallePlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [plan, setPlan] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [misCalificaciones, setMisCalificaciones] = useState({}); // { calificadoId: {estrellas, comentario} }
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(null);
  const [calificacionesGuardadas, setCalificacionesGuardadas] = useState(new Set());

  useEffect(() => {
    cargarPlan();
  }, [id]);

  async function cargarPlan() {
    setCargando(true);
    const { data: sesion } = await supabase.auth.getSession();
    const usuarioActual = sesion.session?.user || null;
    setUsuario(usuarioActual);

    const { data: planData } = await supabase.from("planes").select("*").eq("id", id).single();
    setPlan(planData);

    if (planData) {
      const { data: inscritos } = await supabase
        .from("inscripciones")
        .select("usuario_id, profiles(nombre)")
        .eq("plan_id", id);
      setParticipantes(inscritos || []);

      if (usuarioActual) {
        const { data: calif } = await supabase
          .from("calificaciones")
          .select("calificado_id, estrellas, comentario")
          .eq("plan_id", id)
          .eq("calificador_id", usuarioActual.id);

        const mapa = {};
        const guardadas = new Set();
        (calif || []).forEach((c) => {
          mapa[c.calificado_id] = { estrellas: c.estrellas, comentario: c.comentario || "" };
          guardadas.add(c.calificado_id);
        });
        setMisCalificaciones(mapa);
        setCalificacionesGuardadas(guardadas);
      }
    }
    setCargando(false);
  }

  function actualizarEstrellas(calificadoId, estrellas) {
    setMisCalificaciones((prev) => ({
      ...prev,
      [calificadoId]: { ...prev[calificadoId], estrellas, comentario: prev[calificadoId]?.comentario || "" },
    }));
  }

  function actualizarComentario(calificadoId, comentario) {
    setMisCalificaciones((prev) => ({
      ...prev,
      [calificadoId]: { ...prev[calificadoId], comentario, estrellas: prev[calificadoId]?.estrellas || 0 },
    }));
  }

  async function guardarCalificacion(calificadoId) {
    const datos = misCalificaciones[calificadoId];
    if (!datos || !datos.estrellas) return;

    setEnviandoCalificacion(calificadoId);
    const { error } = await supabase.from("calificaciones").upsert(
      {
        plan_id: id,
        calificador_id: usuario.id,
        calificado_id: calificadoId,
        estrellas: datos.estrellas,
        comentario: datos.comentario || null,
      },
      { onConflict: "plan_id,calificador_id,calificado_id" }
    );
    setEnviandoCalificacion(null);

    if (!error) {
      setCalificacionesGuardadas((prev) => new Set(prev).add(calificadoId));
    }
  }

  async function unirse() {
    if (!usuario) {
      router.push("/login");
      return;
    }
    setAccionEnCurso(true);
    setMensaje("");
    const { data, error } = await supabase.rpc("inscribirse_a_plan", { p_plan_id: id });
    setAccionEnCurso(false);
    if (error) {
      setMensaje("Ocurrió un error, intenta de nuevo.");
    } else {
      setMensaje(MENSAJES[data] || "");
      await cargarPlan();
    }
  }

  async function cancelar() {
    setAccionEnCurso(true);
    setMensaje("");
    const { data, error } = await supabase.rpc("cancelar_inscripcion", { p_plan_id: id });
    setAccionEnCurso(false);
    if (error) {
      setMensaje("Ocurrió un error, intenta de nuevo.");
    } else {
      setMensaje(MENSAJES[data] || "");
      await cargarPlan();
    }
  }

  if (cargando) return <p className="text-ink/60">Cargando plan...</p>;
  if (!plan) return <p className="text-ink/60">Este plan no existe o fue eliminado.</p>;

  const yaInscrito = participantes.some((p) => p.usuario_id === usuario?.id);
  const esCreador = usuario?.id === plan.creador_id;
  const cupoLleno = participantes.length >= plan.cupo_maximo;

  return (
    <div className="pin-card rounded-xl shadow-pin p-8 max-w-lg mx-auto">
      <div className="pin-dot" />
      {plan.foto_url && (
        <img
          src={plan.foto_url}
          alt={plan.actividad}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      )}
      <h1 className="font-display text-3xl mb-1">{plan.actividad}</h1>
      <p className="text-sm text-ink/60 mb-4">
        {new Date(plan.fecha).toLocaleString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · {plan.lugar}
      </p>

      {plan.descripcion && <p className="text-ink/80 mb-4">{plan.descripcion}</p>}

      <p className="text-sm font-medium mb-2">
        {participantes.length}/{plan.cupo_maximo} inscritos
      </p>
      <ul className="text-sm text-ink/70 mb-6 list-disc list-inside">
        {participantes.map((p) => (
          <li key={p.usuario_id}>{p.profiles?.nombre || "Estudiante"}</li>
        ))}
      </ul>

      {mensaje && <p className="text-clay text-sm mb-4">{mensaje}</p>}

      {plan.estado === "cancelado" && (
        <p className="text-clay font-medium">Este plan fue cancelado por su creador.</p>
      )}

      {plan.estado !== "cancelado" && !esCreador && !yaInscrito && (
        <button
          onClick={unirse}
          disabled={accionEnCurso || cupoLleno}
          className="w-full bg-moss text-paper py-2.5 rounded-lg font-semibold hover:bg-ink transition-colors disabled:opacity-50"
        >
          {cupoLleno ? "Cupo lleno" : accionEnCurso ? "Uniéndote..." : "Unirme al plan"}
        </button>
      )}

      {plan.estado !== "cancelado" && !esCreador && yaInscrito && (
        <button
          onClick={cancelar}
          disabled={accionEnCurso}
          className="w-full bg-clay text-paper py-2.5 rounded-lg font-semibold hover:bg-ink transition-colors disabled:opacity-50"
        >
          {accionEnCurso ? "Cancelando..." : "Cancelar mi inscripción"}
        </button>
      )}

      {esCreador && plan.estado !== "cancelado" && (
        <p className="text-sm text-ink/60">Eres el creador de este plan.</p>
      )}

      {yaInscrito && new Date(plan.fecha) < new Date() && participantes.length > 1 && (
        <div className="mt-8 pt-6 border-t border-ink/10">
          <h2 className="font-display text-2xl mb-1">Califica a tus compañeros</h2>
          <p className="text-xs text-ink/50 mb-4">
            Este plan ya pasó. Ayuda a otros estudiantes a saber con quién van a coincidir.
          </p>

          {participantes
            .filter((p) => p.usuario_id !== usuario.id)
            .map((p) => {
              const datos = misCalificaciones[p.usuario_id] || { estrellas: 0, comentario: "" };
              const yaGuardada = calificacionesGuardadas.has(p.usuario_id);
              return (
                <div key={p.usuario_id} className="bg-board/60 rounded-xl p-4 mb-3">
                  <p className="text-sm font-medium mb-2">{p.profiles?.nombre || "Estudiante"}</p>
                  <SelectorEstrellas
                    valor={datos.estrellas}
                    onChange={(n) => actualizarEstrellas(p.usuario_id, n)}
                  />
                  <input
                    type="text"
                    placeholder="Comentario opcional..."
                    value={datos.comentario}
                    onChange={(e) => actualizarComentario(p.usuario_id, e.target.value)}
                    className="w-full mt-2 border border-ink/20 rounded-lg px-3 py-1.5 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                  <button
                    onClick={() => guardarCalificacion(p.usuario_id)}
                    disabled={!datos.estrellas || enviandoCalificacion === p.usuario_id}
                    className="mt-2 text-xs bg-ink text-paper px-3 py-1.5 rounded-full font-medium disabled:opacity-50"
                  >
                    {enviandoCalificacion === p.usuario_id
                      ? "Guardando..."
                      : yaGuardada
                      ? "Actualizar calificación"
                      : "Guardar calificación"}
                  </button>
                  {yaGuardada && <span className="text-xs text-moss ml-2">Guardada ✓</span>}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
