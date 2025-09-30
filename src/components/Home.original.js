"use client";
import React, { useState, useEffect } from "react";
import { useMobileSession } from '../hooks/useMobileSession';   

import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "./BottomNav";

// Iconos SVG
const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
  </svg>
);

const IconHelp = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-1m0-4a1 1 0 10-1-1 1 1 0 001 1zm0 0v2" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const IconChevronDown = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const IconSparkles = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const IconPerfil = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
  </svg>
);

const Home = () => {
  const { data: session, loading, signOut } = useMobileSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Solo marcar como montado después del primer render
  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = (() => {
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email.split("@")[0];
    return "Usuario";
  })();

  // Verificar sesión y redirigir si es necesario - Dar más tiempo para cargar
  useEffect(() => {
    if (mounted && !loading) {
      // Dar un momento extra para que la sesión se establezca
      const timer = setTimeout(() => {
        if (!session) {
          console.log('⚠️ Home: No hay sesión después del timeout, redirigiendo a login');
          router.replace('/login');
        } else {
          console.log('✅ Home: Sesión encontrada:', session.user?.email);
        }
      }, 100); // Pequeño delay para asegurar que la sesión se establezca

      return () => clearTimeout(timer);
    }
  }, [mounted, loading, session, router]);

  // Mostrar loading mientras no esté montado o cargando
  if (!mounted || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mb-4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        <span style={{ color: '#333', fontSize: 20, fontWeight: 500 }}>Cargando sesión...</span>
      </div>
    );
  }

  // Si no hay sesión después de cargar, mostrar loading un poco más
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mb-4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        <span style={{ color: '#333', fontSize: 20, fontWeight: 500 }}>Verificando autenticación...</span>
      </div>
    );
  }

  // Obtener nombre del usuario
  const getUserName = () => {
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email.split("@")[0];
    return "Usuario";
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    // Limpiar localStorage
    try {
      localStorage.removeItem('bisonte_mobile_session');
      localStorage.removeItem('google_auth_data');
      localStorage.removeItem('session_data');
      localStorage.removeItem('authToken');
    } catch {}
    signOut();
    router.push("/");
  };

  // Cerrar menu al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setShowProfileMenu(false);
    if (showProfileMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showProfileMenu]);

  const ADMIN_EMAILS = [
    "3000bisonte@gmail.com",
    "bisonteangela@gmail.com",
    "bisonteoskar@gmail.com",
  ];
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 flex flex-col items-center w-full relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#18191A] border-b-4 border-[#41e0b3] shadow-xl w-full">
        <div className="mx-auto w-full flex items-center justify-between px-4 sm:px-6 py-2 rounded-b-3xl min-h-[56px]">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/home/" className="shrink-0">
              <img src="/LogoNew.jpeg" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300" />
            </Link>
            <span className="text-[#41e0b3] font-extrabold text-2xl tracking-wide drop-shadow truncate">Bisonte</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Menú de perfil */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-2 text-[#41e0b3] hover:text-white p-2 rounded-xl transition-all duration-200 bg-[#23272b] hover:bg-[#41e0b3]/20 shadow"
              >
                <IconUser />
                <IconChevronDown className={`transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#18191A]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#41e0b3]/30 py-2 min-w-[180px] z-40">
                  <Link
                    href="/perfilCard"
                    className="flex items-center gap-3 px-4 py-3 text-[#41e0b3] hover:bg-[#23272b] transition-colors rounded-xl mx-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <IconPerfil />
                    <span className="text-sm truncate max-w-[160px]">{session?.user?.email}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-100/10 transition-colors w-full text-left rounded-xl mx-2"
                  >
                    <IconLogout />
                    <span className="text-sm">salir</span>
                  </button>
                </div>
              )}
            </div>
            <Link href="/contacto" className="text-[#41e0b3] hover:text-white p-2 rounded-xl transition-colors bg-[#23272b] hover:bg-[#41e0b3]/20 shadow">
              <IconHelp />
            </Link>
          </div>
        </div>
      </header>

      {/* Bienvenida */}
      <section className="w-full z-20">
        <div className="mx-auto max-w-md px-4">
          <div className="mt-3 bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white rounded-2xl shadow-lg border border-white/10 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center ring-1 ring-white/20">
              <span className="font-bold">👋</span>
            </div>
            <p className="text-sm sm:text-base leading-tight">
              <span className="opacity-90">Bienvenido a </span>
              <span className="font-semibold">Bisonte App</span>
              <span className="opacity-90">, </span>
              <span className="font-bold truncate max-w-[12rem] inline-block align-bottom">{userName}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <main className="w-full max-w-md flex-1 flex flex-col gap-8 pb-32 px-4 relative z-10">
        {/* Hero section */}
        <section className="bg-[#18191A]/90 rounded-3xl p-8 border-2 border-[#41e0b3]/30 shadow-2xl shadow-[#41e0b3]/10">
          <div className="text-center mb-8">
            <h1 className="text-white font-extrabold text-3xl mb-4 leading-tight drop-shadow">
              Envíos más <span className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] bg-clip-text text-transparent">inteligentes</span>
            </h1>
            <p className="text-gray-300 text-base leading-relaxed mb-8 font-light">
              Plataforma diseñada para hacer tus envíos <br />
              <span className="font-semibold text-[#41e0b3]">simples, rápidos y económicos</span>
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/cotizador"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#41e0b3]/30 hover:shadow-xl hover:shadow-[#41e0b3]/50 transform hover:scale-105 transition-all duration-300"
            >
              <IconSparkles />
              <span>Cotizar ahora</span>
            </Link>
          </div>
        </section>

        {/* Navegación inferior */}
        <BottomNav />
      </main>
    </div>
  );
};

export default Home;
