"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function ConversacionPage() {
  const { usuarioId: otroId } = useParams();
  const router = useRouter();
  const [miId, setMiId] = useState(null);
  const [otraPersona, setOtraPersona] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [conectados, setConectados] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    iniciar();
    const intervalo = setInterval(cargarMensajes, 5000); // "tiempo casi real": refresca cada 5s
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otroId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function iniciar() {
    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) {
      router.push("/login");
      return;
    }
    setMiId(sesion.session.user.id);

    const { data: perfil } = await supabase
      .from("profiles")
      .select("id, nombre, foto_url")
      .eq("id", otroId)
      .single();
    setOtraPersona(perfil);

    await cargarMensajes(sesion.session.user.id);
    setCargando(false);
  }

  async function cargarMensajes(idPropio) {
    const usuarioId = idPropio || miId;
    if (!usuarioId) return;

    const { data, error } = await supabase
      .from("mensajes")
      .select("*")
      .or(
        `and(remitente_id.eq.${usuarioId},destinatario_id.eq.${otroId}),and(remitente_id.eq.${otroId},destinatario_id.eq.${usuarioId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      // Si Supabase rechaza por RLS, probablemente no hay conexión aceptada todavía
      setConectados(false);
      return;
    }

    setMensajes(data || []);

    const idsNoLeidos = (data || [])
      .filter((m) => !m.leido && m.destinatario_id === usuarioId)
      .map((m) => m.id);
    if (idsNoLeidos.length > 0) {
      await supabase.from("mensajes").update({ leido: true }).in("id", idsNoLeidos);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;

    setEnviando(true);
    const { error } = await supabase.from("mensajes").insert({
      remitente_id: miId,
      destinatario_id: otroId,
      contenido: texto,
    });
    setEnviando(false);

    if (error) {
      setConectados(false);
      return;
    }

    setTexto("");
    cargarMensajes();
  }

  if (cargando) return <p className="text-ink/60 not-italic">Cargando conversación...</p>;

  if (!conectados) {
    return (
      <div className="pin-card rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="pin-dot" />
        <p className="text-sm not-italic">
          Solo puedes escribirle a alguien con quien ya tengas una conexión aceptada. Ve a{" "}
          <Link href="/conexiones" className="underline font-medium">
            Conexiones
          </Link>{" "}
          para revisar o enviar una solicitud.
        </p>
      </div>
    );
  }

  return (
    <div className="pin-card rounded-2xl shadow-pin p-6 max-w-lg mx-auto flex flex-col h-[70vh]">
      <div className="pin-dot" />
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-ink/10">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-board border border-ink/10 flex items-center justify-center shrink-0">
          {otraPersona?.foto_url ? (
            <img src={otraPersona.foto_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ink/30 not-italic">{otraPersona?.nombre?.[0]?.toUpperCase() || "?"}</span>
          )}
        </div>
        <h1 className="font-display text-2xl">{otraPersona?.nombre || "Estudiante"}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {mensajes.length === 0 && (
          <p className="text-xs text-ink/50 not-italic text-center mt-8">
            Aún no hay mensajes. Rómpe el hielo 👋
          </p>
        )}
        {mensajes.map((m) => {
          const esMio = m.remitente_id === miId;
          return (
            <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
              <div
                className={`not-italic text-sm px-3 py-2 rounded-2xl max-w-[75%] ${
                  esMio ? "bg-ink text-paper" : "bg-board text-ink"
                }`}
              >
                {m.contenido}
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="flex gap-2 mt-4 pt-4 border-t border-ink/10">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 border border-ink/20 rounded-full px-4 py-2 text-sm bg-paper not-italic focus:outline-none focus:ring-2 focus:ring-mustard"
        />
        <button
          type="submit"
          disabled={enviando}
          className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded-full not-italic disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
