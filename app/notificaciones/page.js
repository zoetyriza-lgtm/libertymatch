"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function NotificacionesPage() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState([]);
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

    const { data } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_id", sesion.session.user.id)
      .order("created_at", { ascending: false });

    setNotificaciones(data || []);
    setCargando(false);

    const idsNoLeidas = (data || []).filter((n) => !n.leida).map((n) => n.id);
    if (idsNoLeidas.length > 0) {
      await supabase.from("notificaciones").update({ leida: true }).in("id", idsNoLeidas);
    }
  }

  function formatear(fechaISO) {
    return new Date(fechaISO).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (cargando) return <p className="text-ink/60">Cargando avisos...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Tus avisos</h1>

      {notificaciones.length === 0 && (
        <div className="pin-card rounded-xl p-8 text-center">
          <div className="pin-dot" />
          <p className="text-ink/70">Todavía no tienes avisos.</p>
        </div>
      )}

      {notificaciones.map((n) => (
        <div key={n.id} className="pin-card rounded-xl shadow-pin p-4 mb-3 flex items-start justify-between gap-4">
          <p className={`text-sm ${n.leida ? "text-ink/70" : "text-ink font-medium"}`}>{n.mensaje}</p>
          <span className="text-xs text-ink/40 shrink-0">{formatear(n.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
