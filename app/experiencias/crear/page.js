"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { subirImagen } from "../../../lib/uploadImage";

export default function CrearExperienciaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [misPlanes, setMisPlanes] = useState([]);
  const [planId, setPlanId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagen, setImagen] = useState(null);
  const [previaImagen, setPreviaImagen] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) {
      router.push("/login");
      return;
    }
    setUsuario(sesion.session.user);

    // Planes en los que participó (creados o inscrito), para poder etiquetar la experiencia
    const usuarioId = sesion.session.user.id;
    const { data: creados } = await supabase.from("planes").select("id, actividad").eq("creador_id", usuarioId);
    const { data: inscripciones } = await supabase
      .from("inscripciones")
      .select("planes(id, actividad)")
      .eq("usuario_id", usuarioId);

    const inscritosComoPlan = (inscripciones || []).map((i) => i.planes).filter(Boolean);
    const todos = [...(creados || []), ...inscritosComoPlan];
    const unicos = Array.from(new Map(todos.map((p) => [p.id, p])).values());
    setMisPlanes(unicos);
  }

  function handleImagenChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImagen(archivo);
    setPreviaImagen(URL.createObjectURL(archivo));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim() || !contenido.trim()) {
      setError("Completa el título y el contenido.");
      return;
    }

    setCargando(true);

    try {
      let fotoUrl = null;
      if (imagen) {
        fotoUrl = await subirImagen("experiencias", imagen, usuario.id);
      }

      const { error: insertError } = await supabase.from("experiencias").insert({
        autor_id: usuario.id,
        plan_id: planId || null,
        titulo,
        contenido,
        foto_url: fotoUrl,
      });

      if (insertError) throw insertError;

      router.push("/experiencias");
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  if (!usuario) return null;

  return (
    <div className="pin-card rounded-2xl shadow-pin p-8 max-w-lg mx-auto">
      <div className="pin-dot" />
      <h1 className="font-display text-3xl mb-1">Comparte tu experiencia</h1>
      <p className="text-sm text-ink/60 mb-6 not-italic">Cuéntale al campus cómo te fue en un plan.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {misPlanes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1 not-italic">¿Sobre qué plan? (opcional)</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-paper not-italic focus:outline-none focus:ring-2 focus:ring-mustard"
            >
              <option value="">Ninguno en particular</option>
              {misPlanes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.actividad}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 not-italic">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Encontré a mi compañera de running"
            className="w-full border border-ink/20 rounded-lg px-3 py-2 not-italic focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 not-italic">Tu historia</label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={5}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 not-italic focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 not-italic">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImagenChange}
            className="w-full text-sm border border-ink/20 rounded-lg px-3 py-2 not-italic file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-mustard file:text-paper file:font-medium"
          />
          {previaImagen && (
            <img
              src={previaImagen}
              alt="Vista previa"
              className="mt-3 rounded-xl w-full h-40 object-cover border border-ink/10"
            />
          )}
        </div>

        {error && <p className="text-clay text-sm not-italic">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-ink text-paper py-2.5 rounded-full font-medium not-italic disabled:opacity-50"
        >
          {cargando ? "Publicando..." : "Publicar experiencia"}
        </button>
      </form>
    </div>
  );
}
