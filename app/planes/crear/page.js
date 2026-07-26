"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { subirImagen } from "../../../lib/uploadImage";

export default function CrearPlanPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [actividad, setActividad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [cupoMaximo, setCupoMaximo] = useState(4);
  const [imagen, setImagen] = useState(null);
  const [previaImagen, setPreviaImagen] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleImagenChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 5MB.");
      return;
    }
    setImagen(archivo);
    setPreviaImagen(URL.createObjectURL(archivo));
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setUsuario(data.session.user);
      }
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!actividad.trim() || !lugar.trim()) {
      setError("Completa la actividad y el lugar.");
      return;
    }
    if (cupoMaximo <= 0) {
      setError("El cupo máximo debe ser mayor a 0.");
      return;
    }
    if (new Date(fecha) < new Date()) {
      setError("La fecha debe ser en el futuro.");
      return;
    }

    setCargando(true);

    let imagenUrl = null;
    if (imagen) {
      try {
        imagenUrl = await subirImagen("planes", imagen, usuario.id);
      } catch (uploadError) {
        setCargando(false);
        setError("No se pudo subir la imagen: " + uploadError.message);
        return;
      }
    }

    const { data: nuevoPlan, error: insertError } = await supabase
      .from("planes")
      .insert({
        creador_id: usuario.id,
        actividad,
        descripcion,
        fecha,
        lugar,
        cupo_maximo: Number(cupoMaximo),
        estado: "abierto",
        foto_url: imagenUrl,
      })
      .select()
      .single();

    if (insertError) {
      setCargando(false);
      setError(insertError.message);
      return;
    }

    // El creador ocupa un cupo automáticamente
    await supabase.from("inscripciones").insert({
      plan_id: nuevoPlan.id,
      usuario_id: usuario.id,
    });

    setCargando(false);
    router.push(`/planes/${nuevoPlan.id}`);
  }

  if (!usuario) return null;

  return (
    <div className="pin-card rounded-xl shadow-pin p-8 max-w-lg mx-auto">
      <div className="pin-dot" />
      <h1 className="font-display text-3xl mb-1">Publica un plan</h1>
      <p className="text-sm text-ink/60 mb-6">Dile al campus qué vas a hacer y cuándo.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Actividad</label>
          <input
            type="text"
            placeholder="Ej. Correr en la pista"
            value={actividad}
            onChange={(e) => setActividad(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cupo máximo</label>
            <input
              type="number"
              min="1"
              value={cupoMaximo}
              onChange={(e) => setCupoMaximo(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lugar</label>
          <input
            type="text"
            placeholder="Ej. Biblioteca central"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImagenChange}
            className="w-full text-sm border border-ink/20 rounded-lg px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-mustard file:text-ink file:font-semibold"
          />
          {previaImagen && (
            <img
              src={previaImagen}
              alt="Vista previa"
              className="mt-3 rounded-xl w-full h-40 object-cover border-2 border-ink/10"
            />
          )}
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-ink text-paper py-2.5 rounded-lg font-semibold hover:bg-moss transition-colors disabled:opacity-50"
        >
          {cargando ? "Publicando..." : "Publicar plan"}
        </button>
      </form>
    </div>
  );
}
