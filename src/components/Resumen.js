"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MegaSaleModal from "./MegaSaleModal";
import DescuentoAnunciosModal from "./DescuentoAnunciosModal";
import BottomNav from "./BottomNav";

// --- Helper Functions ---
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function generarNumeroGuia() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `BIS${timestamp.slice(-6)}${random}`;
}

const ciudades = {
  "11001": "Bogotá D.C.", "25001": "Funza", "25019": "Mosquera",
  "25040": "Madrid", "25148": "Cota", "25175": "Chía",
  "25183": "Cajicá", "25189": "La Calera", "25785": "Tabio",
  "25740": "Soacha", "25743": "Sibaté",
};

// --- Main Component ---
export default function Resumen() {
  const { data: session } = useSession();
  const router = useRouter();

  // --- State Management ---
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [costoTotal, setCostoTotal] = useState(null);
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  // UI State
  const [showRemitente, setShowRemitente] = useState(false);
  const [showDestinatario, setShowDestinatario] = useState(false);
  const [showMegaSale, setShowMegaSale] = useState(false);

  // Ad State
  const [adState, setAdState] = useState("idle"); // idle, preloading, ready, loading, watching, done, error
  const [retryCount, setRetryCount] = useState(0);
  const adTimeoutRef = useRef(null);
  const MAX_RETRIES = 3;

  // --- Ad Logic ---

  const handleAdError = useCallback((errorType) => {
    console.error(`❌ Error de anuncio: ${errorType}`);
    setAdState("error");
    if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
  }, []);

  const preloadAd = useCallback(() => {
    if (adState === "preloading" || adState === "ready") return;
    if (window.AndroidInterface?.preloadRewardedAd) {
      console.log("📺 Precargando anuncio recompensado...");
      setAdState("preloading");
      try {
        window.AndroidInterface.preloadRewardedAd();
      } catch (error) {
        console.error("❌ Error al llamar a preloadRewardedAd:", error);
        handleAdError("preload_exception");
      }
    } else {
      console.log("⚠️ Interfaz de anuncios no disponible.");
      setAdState("idle"); // No hay interfaz, no se puede hacer nada.
    }
  }, [adState, handleAdError]);

  const showAd = useCallback(() => {
    if (costoTotal <= 0) {
      alert("¡Tu envío ya es gratuito! 🎉");
      return;
    }
    if (adState !== "ready") {
      preloadAd();
      alert("📱 Preparando anuncio. Por favor, espera unos segundos e inténtalo de nuevo.");
      return;
    }
    if (window.AndroidInterface?.showRewardedAd) {
      console.log("📺 Mostrando anuncio recompensado...");
      setAdState("loading");
      try {
        window.AndroidInterface.showRewardedAd();
        // Timeout de seguridad por si el anuncio no se muestra
        adTimeoutRef.current = setTimeout(() => {
          if (adState === "loading") handleAdError("show_timeout");
        }, 8000);
      } catch (error) {
        console.error("❌ Error al llamar a showRewardedAd:", error);
        handleAdError("show_exception");
      }
    } else {
      alert("📱 Los anuncios solo están disponibles en la app móvil.\n💡 Descarga la app para obtener descuentos.");
    }
  }, [adState, costoTotal, preloadAd, handleAdError]);

  // --- Effects ---

  // Cargar datos iniciales de localStorage
  useEffect(() => {
    const cotizadorData = JSON.parse(localStorage.getItem("formCotizador"));
    const remitenteData = JSON.parse(localStorage.getItem("formRemitente"));
    const destinatarioData = JSON.parse(localStorage.getItem("formDestinatario"));
    setCotizador(cotizadorData);
    setRemitente(remitenteData);
    setDestinatario(destinatarioData);
    if (cotizadorData?.costoTotal !== undefined) {
      setCostoTotal(cotizadorData.costoTotal);
    }
  }, []);

  // Listener para mensajes de la interfaz nativa de Android
  useEffect(() => {
    const handleRewardedAdMessage = (event) => {
      let data = event.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch (e) { return; }

      if (!data || !data.type) return;

      console.log("📬 Mensaje recibido del anuncio:", data);
      if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);

      if (data.type === "reward" && data.status === "completed") {
        setAdState("done");
        const earnedReward = data.amount || 2013;
        const currentCotizador = JSON.parse(localStorage.getItem("formCotizador"));
        if (currentCotizador && typeof currentCotizador.costoTotal === "number") {
          const nuevoCosto = Math.max(0, currentCotizador.costoTotal - earnedReward);
          currentCotizador.costoTotal = nuevoCosto;
          localStorage.setItem("formCotizador", JSON.stringify(currentCotizador));
          setCotizador(currentCotizador);
          setCostoTotal(nuevoCosto);
        }
        setTimeout(() => {
          setAdState("idle");
          preloadAd();
        }, 3000);
      } else if (data.type === "adStatus") {
        switch (data.status) {
          case "ready": setAdState("ready"); setRetryCount(0); break;
          case "opened": setAdState("watching"); break;
          case "closed": setAdState("idle"); preloadAd(); break;
          case "error": handleAdError(data.errorType || "unknown_error"); break;
          default: setAdState(data.status); break;
        }
      }
    };

    window.addEventListener("message", handleRewardedAdMessage);
    return () => window.removeEventListener("message", handleRewardedAdMessage);
  }, [preloadAd, handleAdError]);

  // Lógica de reintento para errores de anuncios
  useEffect(() => {
    if (adState === "error" && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 Reintentando precarga en ${delay / 1000}s...`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        preloadAd();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [adState, retryCount, preloadAd]);

  // Precarga inicial y muestra del modal de oferta
  useEffect(() => {
    if (cotizador && remitente && destinatario && costoTotal > 0) {
      const timer = setTimeout(preloadAd, 500);
      return () => clearTimeout(timer);
    }
  }, [cotizador, remitente, destinatario, costoTotal, preloadAd]);

  useEffect(() => {
    if (adState === "ready" && costoTotal > 0) {
      const timer = setTimeout(() => setShowMegaSale(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [adState, costoTotal]);

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
    };
  }, []);

  // --- Handlers ---

  const handlePagar = async () => {
    setShowMegaSale(false);
    if (costoTotal === 0) {
      await handleFreeShipment();
    } else {
      router.push("/mercadopago");
    }
  };

  const handleFreeShipment = useCallback(async () => {
    if (!session?.user?.email) {
      alert("Error: No se detectó una sesión activa.");
      return;
    }
    if (costoTotal > 0) return;

    setIsCreatingShipment(true);
    const numeroGuia = generarNumeroGuia();
    const envioData = {
      numeroGuia,
      paymentId: `FREE-${Date.now()}`,
      origen: remitente.direccionRecogida,
      destino: destinatario.direccionEntrega,
      destinatario: destinatario.nombre,
      remitente: remitente.nombre,
      usuarioEmail: session.user.email,
      tipo: "gratuito"
    };

    try {
      const response = await fetch("/api/guardarenvio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envioData),
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem("envioDatos", JSON.stringify(responseData));
        localStorage.setItem("envioExitoso", "true");
        alert("¡Envío gratuito realizado exitosamente!");
        router.push("/misenvios");
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error al registrar el envío gratuito:", error);
      alert("Hubo un problema al registrar tu envío. Por favor, contacta a soporte.");
    } finally {
      setIsCreatingShipment(false);
    }
  }, [router, costoTotal, session, remitente, destinatario]);

  const handleWatchAdFromModal = () => {
    setShowMegaSale(false);
    setTimeout(showAd, 300);
  };

  // --- Render Logic ---

  if (!cotizador || !remitente || !destinatario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Información incompleta</h3>
          <p className="text-slate-600">Por favor completa todos los formularios para ver el resumen de tu envío.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-[#18191A] mb-2 drop-shadow">Resumen del envío</h1>
          <p className="text-[#41e0b3] font-medium">Revisa los detalles antes de proceder al pago</p>
        </div>

        {/* Ruta del envío */}
        <div className="bg-[#18191A]/90 rounded-3xl shadow-xl border-2 border-[#41e0b3]/30 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="w-4 h-4 bg-[#41e0b3] rounded-full mb-2 animate-pulse"></div>
                <p className="text-sm font-bold text-white">Bogotá</p>
                <p className="text-xs text-[#41e0b3]">Origen</p>
              </div>
              <div className="flex-1 h-px bg-[#41e0b3]/30 mx-4"></div>
              <div className="text-center">
                <div className="w-4 h-4 bg-[#41e0b3] rounded-full mb-2 animate-pulse"></div>
                <p className="text-sm font-bold text-white">
                  {ciudades[cotizador.ciudadDestino] || cotizador.ciudadDestino}
                </p>
                <p className="text-xs text-[#41e0b3]">Destino</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#41e0b3] drop-shadow">
                {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || 0).toLocaleString("es-CO")}`}
              </p>
              <p className="text-sm text-white">Costo total</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Datos de contacto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Remitente */}
            <div className="bg-[#23272b]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6 mb-2 transition-all duration-300">
              <button
                onClick={() => setShowRemitente((v) => !v)}
                className="flex items-center w-full justify-between text-left text-[#41e0b3] font-bold text-lg focus:outline-none transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#41e0b3" strokeWidth="2" fill="none" />
                    <path d="M12 8v4l2 2" stroke="#41e0b3" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Remitente
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${showRemitente ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="#41e0b3"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ${showRemitente ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-3 text-sm text-white">
                  <div>
                    <p className="font-semibold">{remitente.nombre}</p>
                    <p className="text-[#41e0b3]">{remitente.tipoDocumento} {remitente.numeroDocumento}</p>
                  </div>
                  <div>
                    <p>{remitente.celular}</p>
                    <p>{remitente.correo}</p>
                  </div>
                  <div>
                    <p>{remitente.direccionRecogida}</p>
                    {remitente.detalleDireccion && (
                      <p className="text-xs text-[#41e0b3] mt-1">{remitente.detalleDireccion}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Destinatario */}
            <div className="bg-[#23272b]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6 mb-2 transition-all duration-300">
              <button
                onClick={() => setShowDestinatario((v) => !v)}
                className="flex items-center w-full justify-between text-left text-[#41e0b3] font-bold text-lg focus:outline-none transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#41e0b3" strokeWidth="2" fill="none" />
                    <path d="M12 8v4l2 2" stroke="#41e0b3" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Destinatario
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${showDestinatario ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="#41e0b3"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ${showDestinatario ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-3 text-sm text-white">
                  <div>
                    <p className="font-semibold">{destinatario.nombre}</p>
                    <p className="text-[#41e0b3]">{destinatario.tipoDocumento} {destinatario.numeroDocumento}</p>
                  </div>
                  <div>
                    <p>{destinatario.celular}</p>
                    <p>{destinatario.correo}</p>
                  </div>
                  <div>
                    <p>{destinatario.direccionEntrega}</p>
                    {destinatario.detalleDireccion && (
                      <p className="text-xs text-[#41e0b3] mt-1">{destinatario.detalleDireccion}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles del paquete */}
            <div className="bg-[#18191A]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6">
              <h3 className="font-bold text-[#41e0b3] mb-6">Detalles del paquete</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Peso</span>
                    <span className="font-semibold text-white">{cotizador.peso} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Valor declarado</span>
                    <span className="font-semibold text-white">
                      ${Number(cotizador.valorDeclarado).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#41e0b3]">Contenido</span>
                    <span className="font-semibold text-white text-right max-w-32 truncate">
                      {cotizador.recomendaciones}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Largo</span>
                    <span className="font-semibold text-white">{cotizador.largo} cm</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Ancho</span>
                    <span className="font-semibold text-white">{cotizador.ancho} cm</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#41e0b3]">Alto</span>
                    <span className="font-semibold text-white">{cotizador.alto} cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen y acciones */}
          <div className="space-y-6">
            <div className="bg-[#18191A]/95 rounded-3xl shadow-2xl border-2 border-[#41e0b3]/30 p-6 sticky top-8 animate-fade-in-up">
              <h3 className="font-bold text-[#41e0b3] mb-6">Resumen</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Tipo de envío</span>
                  <span className="text-white">{cotizador.tipoEnvio || "Paquetes"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Fecha</span>
                  <span className="text-white">{fecha}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Modalidad</span>
                  <span className="text-white">Recogida en ubicación</span>
                </div>
                {session?.user?.email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#41e0b3]">Usuario</span>
                    <span className="text-white text-xs truncate max-w-32">{session.user.email}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-[#41e0b3]/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#41e0b3]">Total</span>
                  <span className="text-2xl font-extrabold text-white drop-shadow">
                    {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || 0).toLocaleString("es-CO")}`}
                  </span>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handlePagar}
                  disabled={isCreatingShipment || !session?.user?.email}
                  className={`w-full font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 ${
                    costoTotal === 0 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
                      : "bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#2bbd8c] hover:to-[#41e0b3] text-white"
                  } ${(isCreatingShipment || !session?.user?.email) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isCreatingShipment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : !session?.user?.email ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Inicia sesión para continuar</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{costoTotal === 0 ? "Confirmar Envío Gratis" : "Proceder al pago"}</span>
                    </>
                  )}
                </button>
                
                {costoTotal > 0 && (
                  <button
                    onClick={showAd}
                    disabled={adState === "preloading" || adState === "loading"}
                    className={`w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all duration-300 flex items-center justify-center gap-2 ${
                      (adState === "preloading" || adState === "loading") ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {adState === "preloading" || adState === "loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Preparando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 10l4.55-2.27A1 1 0 0121 8.66v6.68a1 1 0 01-1.45.89L15 14M5 8h8a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                        </svg>
                        <span>Ver anuncio para descuento</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación entre pantallas */}
        <div className="flex justify-center w-full mt-8 pb-24">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-8 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => router.push("/destinatario")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
        </div>

        {/* MODALES Y FEEDBACK VISUAL */}
        <MegaSaleModal
          open={showMegaSale}
          onClose={() => setShowMegaSale(false)}
          onPay={handlePagar}
          onWatchAd={handleWatchAdFromModal}
        />

        {/* Feedback visual de AdMob */}
        {(adState === "loading" || adState === "preloading") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <span className="block mb-4 text-lg font-bold text-[#41e0b3]">Cargando anuncio...</span>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#41e0b3] mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Por favor espera...</p>
            </div>
          </div>
        )}
        
        {adState === "done" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="block mb-2 text-lg font-bold text-green-600">¡Descuento aplicado!</span>
              <p className="text-sm text-gray-600">Tu nuevo costo se ha actualizado.</p>
            </div>
          </div>
        )}
        
        {adState === "error" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="block mb-4 text-lg font-bold text-red-500">Error al cargar el anuncio</span>
              <p className="text-sm text-gray-600 mb-4">No se pudo mostrar el anuncio. Inténtalo de nuevo.</p>
              <button
                className="bg-[#41e0b3] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2bbd8c] transition-colors"
                onClick={() => { setAdState("idle"); setRetryCount(0); preloadAd(); }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}