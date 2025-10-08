"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type MouseEvent as ReactMouseEvent,
  type SVGProps,
  type TouchEvent as ReactTouchEvent,
} from "react";

import CapacitorGoogleAuth from "@/lib/capacitor-google-auth";

import BottomNav from "./BottomNav";

const mergeIconClasses = (base: string, className?: string) => (className ? `${base} ${className}` : base);

type IconProps = SVGProps<SVGSVGElement>;

type SliderItem = {
  img: string;
  title?: string;
  desc?: string;
};

type StatsSummary = {
  usuarios: number;
  envios: number;
  mensajes: number;
};

const IconUser = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-5 h-5", className)} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
  </svg>
);

const IconHelp = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-5 h-5", className)} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-1m0-4a1 1 0 10-1-1 1 1 0 001 1zm0 0v2" />
  </svg>
);

const IconLogout = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-4 h-4", className)} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" {...props}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const IconChevronDown = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-3 h-3", className)} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const IconSparkles = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-4 h-4", className)} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" {...props}>
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const IconPerfil = ({ className, ...props }: IconProps) => (
  <svg className={mergeIconClasses("w-6 h-6", className)} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" {...props}>
    <path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const sliderData: readonly SliderItem[] = [
  { img: "/slider/slider1.jpg" },
  { img: "/slider/slider2.jpg" },
  { img: "/slider/slider3.jpg" },
];

const ADMIN_EMAILS: readonly string[] = [
  "3000bisonte@gmail.com",
  "bisonteangela@gmail.com",
  "bisonteoskar@gmail.com",
];

const parseStatsSummary = (value: unknown): StatsSummary | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const { usuarios, envios, mensajes } = record;

  if (
    typeof usuarios !== "number" ||
    typeof envios !== "number" ||
    typeof mensajes !== "number"
  ) {
    return null;
  }

  return { usuarios, envios, mensajes };
};

const Home = (): JSX.Element => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const [stats, setStats] = useState<StatsSummary>({ usuarios: 0, envios: 0, mensajes: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const getUserName = (): string => {
    if (session?.user?.name) {
      return session.user.name;
    }

    if (session?.user?.email) {
      return session.user.email.split("@")[0];
    }

    return "Usuario";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bienvenida = window.localStorage.getItem("bienvenidaMostrada");
      if (!bienvenida) {
        setShowWelcome(true);
      }
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bienvenidaMostrada", "true");
    }
  };

  const prevSlide = () => setSlide((s) => (s === 0 ? sliderData.length - 1 : s - 1));
  const nextSlide = () => setSlide((s) => (s === sliderData.length - 1 ? 0 : s + 1));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlide((s) => (s === sliderData.length - 1 ? 0 : s + 1));
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showProfileMenu) {
      return;
    }

    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    setShowProfileMenu(false);

    void (async () => {
      try {
        await CapacitorGoogleAuth.signOut();
      } catch (error: unknown) {
        // Ignore native sign-out errors to avoid blocking logout
      }

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch (error: unknown) {
        // Ignore network errors, session cleanup is best-effort
      }

      await signOut({ redirect: false });
      router.push("/");
    })();
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    touchStartXRef.current = firstTouch ? firstTouch.clientX : null;
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const firstChangedTouch = event.changedTouches[0];
    touchStartXRef.current = null;

    if (startX === null || !firstChangedTouch) {
      return;
    }

    const swipeDistance = startX - firstChangedTouch.clientX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    mouseStartXRef.current = event.clientX;
    const track = sliderTrackRef.current;
    if (track instanceof HTMLElement) {
      track.style.cursor = "grabbing";
    }
  };

  const handleMouseUp = (event: ReactMouseEvent<HTMLDivElement>) => {
    const startX = mouseStartXRef.current;
    mouseStartXRef.current = null;

    if (startX === null) {
      return;
    }

    const swipeDistance = startX - event.clientX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    const track = sliderTrackRef.current;
    if (track instanceof HTMLElement) {
      track.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    const track = sliderTrackRef.current;
    if (track instanceof HTMLElement) {
      track.style.cursor = "default";
    }
  };

  const userEmail = session?.user?.email ?? "";
  const isAdmin = userEmail.length > 0 && ADMIN_EMAILS.includes(userEmail);

  useEffect(() => {
    if (!isAdmin || status !== "authenticated") {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let cancelled = false;

    const fetchStats = async () => {
      if (cancelled) {return;}
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        const json = (await res.json()) as unknown;
        if (cancelled) {return;}
        const parsedStats = parseStatsSummary(json);
        if (parsedStats) {
          setStats(parsedStats);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("[Home] Error obteniendo estadísticas admin:", error);
        }
      }
    };

    void fetchStats();
    const intervalId = window.setInterval(() => {
      void fetchStats();
    }, 30000);

    const handleFocus = () => {
      void fetchStats();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchStats();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAdmin, status]);

  useEffect(() => {
    if (!isAdmin) {
      setStats({ usuarios: 0, envios: 0, mensajes: 0 });
    }
  }, [isAdmin]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#41e0b3] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400 text-sm font-light">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 flex flex-col items-center w-full relative overflow-hidden">

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] bg-[#41e0b3]/20 rounded-full blur-3xl top-[-200px] left-[-200px] animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-[#18191A]/10 rounded-full blur-2xl bottom-[-100px] right-[-100px] animate-pulse" />
      </div>

      <header className="w-full max-w-md flex items-center justify-between px-6 py-4 bg-[#18191A] shadow-xl rounded-b-3xl border-b-4 border-[#41e0b3] fixed top-0 left-1/2 -translate-x-1/2 z-30 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <Link href="/home" className="block">
            <Image
              src="/LogoNew.jpeg"
              alt="Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300"
              priority
            />
          </Link>
          <span className="text-[#41e0b3] font-extrabold text-2xl tracking-wide drop-shadow">Bisonte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowProfileMenu((prev) => !prev);
              }}
              className="flex items-center gap-2 text-[#41e0b3] hover:text-white p-2 rounded-xl transition-all duration-200 bg-[#23272b] hover:bg-[#41e0b3]/20 shadow"
            >
              <IconUser />
              <IconChevronDown className={`transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#18191A]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#41e0b3]/30 py-2 min-w-[180px] z-40 animate-fade-in-down">
                <Link
                  href="/perfilCard"
                  className="flex items-center gap-3 px-4 py-3 text-[#41e0b3] hover:bg-[#23272b] transition-colors rounded-xl mx-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <IconPerfil />
                  <span className="text-sm">{session?.user?.email}</span>
                </Link>
                <Link
                  href="/politica-datos"
                  className="flex items-center gap-3 px-4 py-3 text-[#41e0b3] hover:bg-[#23272b] transition-colors rounded-xl mx-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <span className="text-sm">Tratamiento de Datos</span>
                </Link>
                <Link
                  href="/terminos"
                  className="flex items-center gap-3 px-4 py-3 text-[#41e0b3] hover:bg-[#23272b] transition-colors rounded-xl mx-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <span className="text-sm">Condiciones de Servicio</span>
                </Link>
                <button
                  type="button"
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
      </header>

      <div className="h-24 w-full" />

      <main className="w-full max-w-md flex-1 flex flex-col gap-8 pb-32 px-4 relative z-10">
        <section className="bg-[#18191A]/90 rounded-3xl p-8 border-2 border-[#41e0b3]/30 shadow-2xl shadow-[#41e0b3]/10 animate-fade-in-up">
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
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#41e0b3]/30 hover:shadow-xl hover:shadow-[#41e0b3]/50 transform hover:scale-105 transition-all duration-300 animate-bounce"
            >
              <IconSparkles />
              <span>Cotizar ahora</span>
            </Link>
          </div>
        </section>

        <section className="w-full flex flex-col items-center">
          <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden relative slider-container">
            <div
              className="relative w-full h-[220px] sm:h-[300px] lg:h-[400px] slider-wrapper"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div
                ref={sliderTrackRef}
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] h-full"
                style={{ transform: `translateX(-${slide * 100}%)` }}
              >
                {sliderData.map((slideItem, idx) => (
                  <div
                    key={`${slideItem.img}-${idx}`}
                    className={`min-w-full h-full relative slide ${slide === idx ? "active" : ""}`}
                  >
                    <Image
                      src={slideItem.img}
                      alt={slideItem.title ?? "Imagen del slider"}
                      fill
                      priority={idx === 0}
                      className="object-cover"
                      draggable={false}
                      sizes="(max-width: 1024px) 100vw, 640px"
                    />
                    <div
                      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-transparent to-transparent text-white px-6 py-6 transition-transform duration-300 ${slide === idx ? "translate-y-0" : "translate-y-full"} slide-overlay`}
                    >
                      <div className="text-lg font-semibold mb-1 slide-title">
                        {slideItem.title ?? ""}
                      </div>
                      <div className="text-sm opacity-90 slide-description">
                        {slideItem.desc ?? ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 py-3 bg-white slider-dots">
              {sliderData.map((_, idx) => (
                <span
                  key={`dot-${idx}`}
                  className={`dot w-2 h-2 rounded-full transition-all duration-300 ${slide === idx ? "bg-[#41e0b3] scale-125" : "bg-gray-300"}`}
                  onClick={() => setSlide(idx)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setSlide(idx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-[#41e0b3] font-bold text-xl mb-2 drop-shadow">
              ¿Por qué Bisonte?
            </h2>
            <p className="text-gray-500 text-sm font-light">
              Ventajas que marcan la diferencia
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Rapidez</h3>
              <p className="text-gray-300 text-xs font-light leading-relaxed">
                Entregas en 24-48 horas
              </p>
            </div>
            <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M12 6v12m-3-2.818l.879.659c1.171.8 3.07.8 4.242 0 1.172-.8 1.172-2.164 0-2.964C13.106 12.5 12.553 12 12 12s-1.106-.5-2.121-.123C8.757 12.696 8.757 14.06 9.879 14.818L12 16.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Ahorro</h3>
              <p className="text-gray-300 text-xs font-light leading-relaxed">
                Hasta 40% menos que otros
              </p>
            </div>
            <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Seguridad</h3>
              <p className="text-gray-300 text-xs font-light leading-relaxed">
                Protección total garantizada
              </p>
            </div>
            <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Cobertura</h3>
              <p className="text-gray-300 text-xs font-light leading-relaxed">
                Red nacional completa
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#23272b]/90 rounded-3xl p-8 border-2 border-[#41e0b3]/20 shadow-xl shadow-[#41e0b3]/10 animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-[#41e0b3] font-bold text-xl mb-2">Proceso simple</h2>
            <p className="text-gray-400 text-sm font-light">En solo 3 pasos</p>
          </div>
          <div className="space-y-6">
            {[
              { num: "01", title: "Cotiza", desc: "Ingresa datos básicos del envío" },
              { num: "02", title: "Confirma", desc: "Elige tu opción preferida" },
              { num: "03", title: "Envía", desc: "Nosotros nos encargamos" },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 animate-bounce">
                  {step.num}
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
                  <p className="text-gray-300 text-xs font-light">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {isAdmin && (
          <section className="bg-gradient-to-br from-[#18191A]/95 to-[#23272b]/90 rounded-3xl p-6 border-2 border-[#41e0b3]/30 shadow-2xl shadow-[#41e0b3]/10 animate-fade-in-up backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#41e0b3] mb-1 drop-shadow">
                Panel de Administración
              </h2>
              <p className="text-gray-300 text-sm font-light">Gestión de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/admin/usuarios"
                className="group bg-[#23272b]/80 hover:bg-[#41e0b3]/10 rounded-2xl p-5 border border-[#41e0b3]/20 hover:border-[#41e0b3]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#41e0b3]/20 transform hover:scale-105 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base mb-1 group-hover:text-[#41e0b3] transition-colors">
                    Usuarios
                  </h3>
                  <p className="text-gray-300 text-sm font-light">
                    Gestionar usuarios registrados
                  </p>
                </div>
                <div className="text-[#41e0b3] group-hover:translate-x-1 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/admin/envios"
                className="group bg-[#23272b]/80 hover:bg-[#41e0b3]/10 rounded-2xl p-5 border border-[#41e0b3]/20 hover:border-[#41e0b3]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#41e0b3]/20 transform hover:scale-105 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M8.25 18.75a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zM19.5 18.75a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zM3 4.5h2.25l.75 12.75c.094.621.568 1.125 1.19 1.125h11.555c.621 0 1.134-.504 1.19-1.125L21 7.5H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base mb-1 group-hover:text-[#41e0b3] transition-colors">
                    Envíos
                  </h3>
                  <p className="text-gray-300 text-sm font-light">
                    Monitorear envíos realizados
                  </p>
                </div>
                <div className="text-[#41e0b3] group-hover:translate-x-1 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/admin/contactos"
                className="group bg-[#23272b]/80 hover:bg-[#41e0b3]/10 rounded-2xl p-5 border border-[#41e0b3]/20 hover:border-[#41e0b3]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#41e0b3]/20 transform hover:scale-105 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base mb-1 group-hover:text-[#41e0b3] transition-colors">
                    Mensajes
                  </h3>
                  <p className="text-gray-300 text-sm font-light">
                    Revisar mensajes de contacto
                  </p>
                </div>
                <div className="text-[#41e0b3] group-hover:translate-x-1 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#41e0b3]/20">
              <h3 className="text-lg font-semibold text-[#41e0b3] mb-4 text-center">
                Estadísticas Rápidas
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stats.usuarios}</div>
                  <div className="text-xs text-gray-300 font-light">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stats.envios}</div>
                  <div className="text-xs text-gray-300 font-light">Envíos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stats.mensajes}</div>
                  <div className="text-xs text-gray-300 font-light">Mensajes</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <BottomNav />

        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18191A]/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full mx-4 border-2 border-[#41e0b3]/30 overflow-hidden animate-fade-in-up">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <IconSparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#41e0b3] mb-3">¡Bienvenido!</h2>
                <p className="text-gray-300 font-light mb-2">
                  Hola <span className="font-medium text-[#41e0b3]">{getUserName()}</span>
                </p>
                <p className="text-gray-400 text-sm font-light leading-relaxed mb-8">
                  Ahora puedes disfrutar de nuestros servicios de envío inteligente
                </p>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 mb-8">
                  <p className="text-amber-800 text-sm font-light">
                    <span className="font-medium">Importante:</span> Completa tu perfil para comenzar
                  </p>
                </div>
              </div>
              <div className="px-8 pb-8">
                <button
                  type="button"
                  onClick={handleCloseWelcome}
                  className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold py-4 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 animate-bounce"
                >
                  Comenzar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
