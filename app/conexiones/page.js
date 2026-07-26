"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function ConexionesPage() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useState(null);
  const [recibidas, setRecibidas] = useState([]);
  const [aceptadas, setAceptadas] = useState([]);
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
    const miId = sesion.session.user.id;
    setUsuarioId(miId);

    const { data: todas } = await supabase
      .from("conexiones")
      .select("*, solicitante:profiles!conexiones_solicitante_id_fkey(id, nombre, foto_url), receptor:profiles!conexiones_receptor_id_fkey(id, nombre, foto_url)")
      .or(`solicitante_id.eq.${miId},receptor_id.eq.${miId}`);

    const lista = todas || [];

    setRecibidas(lista.filter((c) => c.estado === "pendiente" && c.receptor_id === miId));
    setAceptadas(lista.filter((c) => c.estado === "aceptada"));

    setCargando(false);
  }

  async function responder(conexionId, nuevoEstado, otroId) {
    await supabase.from("conexiones").update({ estado: nuevoEstado }).eq("id", conexionId);

    if (nuevoEstado === "aceptada") {
      await supabase.from("notificaciones").insert({
        usuario_id: otroId,
        mensaje: "Aceptó tu solicitud de conexión 🎉",
      });
    }

    cargar();
  }

  function otraPersona(conexion) {
    return conexion.solicitante_id === usuarioId ? conexion.receptor : conexion.solicitante;
  }

  if (cargando) return <p className="text-ink/60 not-italic">Cargando conexiones...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Tus conexiones</h1>

      <h2 className="font-display text-xl mb-3">Solicitudes recibidas</h2>
      {recibidas.length === 0 && (
        <p className="text-sm text-ink/60 mb-6 not-italic">No tienes solicitudes pendientes.</p>
      )}
      {recibidas.map((c) => (
        <div key={c.id} className="pin-card rounded-2xl shadow-pin p-4 mb-3 flex items-center gap-4">
          <div className="pin-dot" />
          <div className="w-12 h-12 rounded-full overflow-hidden bg-board border border-ink/10 shrink-0 flex items-center justify-center">
            {c.solicitante?.foto_url ? (
              <img src={c.solicitante.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-ink/30 not-italic">{c.solicitante?.nombre?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <p className="flex-1 text-sm font-medium not-italic">{c.solicitante?.nombre}</p>
          <button
            onClick={() => responder(c.id, "aceptada", c.solicitante_id)}
            className="text-xs bg-moss text-paper px-3 py-1.5 rounded-full font-medium not-italic"
          >
            Aceptar
          </button>
          <button
            onClick={() => responder(c.id, "rechazada", c.solicitante_id)}
            className="text-xs bg-paper border border-ink/20 text-ink/60 px-3 py-1.5 rounded-full font-medium not-italic"
          >
            Rechazar
          </button>
        </div>
      ))}

      <h2 className="font-display text-xl mb-3 mt-8">Mis conexiones</h2>
      {aceptadas.length === 0 && (
        <p className="text-sm text-ink/60 not-italic">Aún no tienes conexiones aceptadas.</p>
      )}
      {aceptadas.map((c) => {
        const persona = otraPersona(c);
        return (
          <div key={c.id} className="pin-card rounded-2xl shadow-pin p-4 mb-3 flex items-center gap-4">
            <div className="pin-dot" />
            <div className="w-12 h-12 rounded-full overflow-hidden bg-board border border-ink/10 shrink-0 flex items-center justify-center">
              {persona?.foto_url ? (
                <img src={persona.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-ink/30 not-italic">{persona?.nombre?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <p className="flex-1 text-sm font-medium not-italic">{persona?.nombre}</p>
            <Link
              href={`/mensajes/${persona?.id}`}
              className="text-xs bg-ink text-paper px-3 py-1.5 rounded-full font-medium not-italic hover:opacity-90 transition-all"
            >
              Mensaje
            </Link>
          </div>
        );
      })}
    </div>
  );
}
