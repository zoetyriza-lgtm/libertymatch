"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { subirImagen } from "../../lib/uploadImage";
import InterestPicker from "../../components/InterestPicker";

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [intereses, setIntereses] = useState([]);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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

    const { data: perfil } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sesion.session.user.id)
      .single();

    if (perfil) {
      setNombre(perfil.nombre || "");
      setBio(perfil.bio || "");
      setIntereses(perfil.intereses || []);
      setFotoUrl(perfil.foto_url || null);
    }
    setCargando(false);
  }

  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoFoto(file);
    setPreviewFoto(URL.createObjectURL(file));
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      let urlFinal = fotoUrl;
      if (archivoFoto) {
        urlFinal = await subirImagen("avatars", archivoFoto, usuario.id);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ nombre, bio, intereses, foto_url: urlFinal })
        .eq("id", usuario.id);

      if (error) throw error;

      setFotoUrl(urlFinal);
      setArchivoFoto(null);
      setMensaje("Perfil actualizado ✨");
    } catch (err) {
      setMensaje("Ocurrió un error al guardar: " + err.message);
    }
    setGuardando(false);
  }

  if (cargando) return <p className="text-ink/60 not-italic">Cargando perfil...</p>;

  return (
    <div className="pin-card rounded-2xl shadow-pin p-8 max-w-lg mx-auto">
      <div className="pin-dot" />
      <h1 className="font-display text-3xl mb-1">Tu perfil</h1>
      <p className="text-sm text-ink/60 mb-6 not-italic">
        Así te van a ver otros estudiantes al buscar match.
      </p>

      <form onSubmit={guardar} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-board border border-ink/10 flex items-center justify-center shrink-0">
            {previewFoto || fotoUrl ? (
              <img
                src={previewFoto || fotoUrl}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-ink/30 text-xs not-italic">Sin foto</span>
            )}
          </div>
          <label className="text-sm bg-paper border border-ink/20 px-4 py-2 rounded-full cursor-pointer hover:border-ink/40 transition-colors not-italic">
            Cambiar foto
            <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 not-italic">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-mustard"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 not-italic">Sobre mí</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Cuéntale al campus algo sobre ti..."
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-mustard"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 not-italic">Tus intereses</label>
          <InterestPicker seleccionados={intereses} onChange={setIntereses} />
        </div>

        {mensaje && <p className="text-sm not-italic">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-ink text-paper py-2.5 rounded-full font-medium not-italic disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>
    </div>
  );
}
