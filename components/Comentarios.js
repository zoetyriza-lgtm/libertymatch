"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Comentarios({ experienciaId }) {
  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function abrir() {
    setAbierto(!abierto);
    if (!abierto && comentarios.length === 0) {
      cargarComentarios();
    }
  }

  async function cargarComentarios() {
    setCargando(true);
    const { data } = await supabase
      .from("comentarios")
      .select("*, profiles(nombre)")
      .eq("experiencia_id", experienciaId)
      .order("created_at", { ascending: true });
    setComentarios(data || []);
    setCargando(false);
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!texto.trim()) return;

    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) {
      window.location.href = "/login";
      return;
    }

    setEnviando(true);
    const { error } = await supabase.from("comentarios").insert({
      experiencia_id: experienciaId,
      autor_id: sesion.session.user.id,
      contenido: texto,
    });
    setEnviando(false);

    if (!error) {
      setTexto("");
      cargarComentarios();
    }
  }

  return (
    <div className="mt-4 not-italic">
      <button
        onClick={abrir}
        className="text-xs font-medium text-ink/60 hover:text-ink transition-colors"
      >
        {abierto ? "Ocultar comentarios" : "Ver / dejar comentario"}
      </button>

      {abierto && (
        <div className="mt-3 space-y-3">
          {cargando && <p className="text-xs text-ink/50">Cargando comentarios...</p>}

          {!cargando && comentarios.length === 0 && (
            <p className="text-xs text-ink/50">Sé el primero en comentar.</p>
          )}

          {comentarios.map((c) => (
            <div key={c.id} className="bg-board/60 rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-ink/70">{c.profiles?.nombre || "Estudiante"}</p>
              <p className="text-sm text-ink/90">{c.contenido}</p>
            </div>
          ))}

          <form onSubmit={enviarComentario} className="flex gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 border border-ink/20 rounded-full px-3 py-1.5 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-mustard"
            />
            <button
              type="submit"
              disabled={enviando}
              className="bg-ink text-paper text-xs font-medium px-4 py-1.5 rounded-full disabled:opacity-50"
            >
              {enviando ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
