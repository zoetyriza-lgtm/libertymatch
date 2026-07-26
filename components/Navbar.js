"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="bg-ink text-paper">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/planes" className="font-display text-2xl not-italic tracking-wide lowercase">
          liberty<span className="text-mustard">match</span>
        </Link>
        <nav className="flex items-center gap-5 text-xs font-medium uppercase tracking-widest">
          <Link href="/planes" className="hover:text-mustard transition-colors">
            Planes
          </Link>
          <Link href="/experiencias" className="hover:text-mustard transition-colors">
            Experiencias
          </Link>
          {session && (
            <>
              <Link href="/planes/crear" className="hover:text-mustard transition-colors">
                Crear
              </Link>
              <Link href="/match" className="hover:text-mustard transition-colors">
                Match
              </Link>
              <Link href="/mis-planes" className="hover:text-mustard transition-colors">
                Mis planes
              </Link>
              <Link href="/notificaciones" className="hover:text-mustard transition-colors">
                Avisos
              </Link>
              <Link href="/perfil" className="hover:text-mustard transition-colors">
                Perfil
              </Link>
              <button onClick={cerrarSesion} className="text-clay hover:text-mustard transition-colors normal-case">
                Salir
              </button>
            </>
          )}
          {!session && (
            <Link
              href="/login"
              className="bg-mustard text-paper px-4 py-2 rounded-full font-medium normal-case tracking-normal hover:opacity-90 transition-all hover:-translate-y-0.5"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
