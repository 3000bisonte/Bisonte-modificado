"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MegaSaleModal from "./MegaSaleModal";
import DescuentoAnunciosModal from "./DescuentoAnunciosModal";

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function Resumen() {
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [showRemitente, setShowRemitente] = useState(false);
  const [showDestinatario, setShowDestinatario] = useState(false);
  const [showMegaSale, setShowMegaSale] = useState(true);
  const [showDescuento, setShowDescuento] = useState(false);
  const [adState, setAdState] = useState("idle"); // idle | loading | error | done

  const router = useRouter();

  // Actualiza la fecha en tiempo real (cada minuto)
  useEffect(() => {
    const interval = setInterval(() => {
      setFecha(formatDate(new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCotizador(JSON.parse(localStorage.getItem("formCotizador")));
    setRemitente(JSON.parse(localStorage.getItem("formRemitente")));
    setDestinatario(JSON.parse(localStorage.getItem("formDestinatario")));
  }, []);

  // Escucha el mensaje de recompensa desde Android
  useEffect(() => {
    function handleRewardedAdMessage(event) {
      if (event.data === "rewardEarned") {
        setAdState("done");
        const cotizadorData = JSON.parse(localStorage.getItem("formCotizador"));
        if (cotizadorData && typeof cotizadorData.costoTotal === "number") {
          const descuento = 10000;
          const nuevoCosto = Math.max(0, cotizadorData.costoTotal - descuento);
          cotizadorData.costoTotal = nuevoCosto;
          localStorage.setItem("formCotizador", JSON.stringify(cotizadorData));
          alert(`¡Descuento aplicado! Nuevo costo: $${nuevoCosto.toLocaleString("es-CO")}`);
          setCotizador({ ...cotizadorData });
        }
      }
      if (event.data === "rewardError") {
        setAdState("error");
      }
    }
    window.addEventListener("message", handleRewardedAdMessage);
    return () => window.removeEventListener("message", handleRewardedAdMessage);
  }, []);

  // Precarga automática al montar
  useEffect(() => {
    if (window.AndroidInterface && window.AndroidInterface.preloadRewardedAd) {
      window.AndroidInterface.preloadRewardedAd();
    }
  }, []);

  // Mostrar el modal automáticamente al entrar
  useEffect(() => {
    setShowMegaSale(true);
  }, []);

  // Cuando el usuario ve el anuncio completo:
  const handleVerAnuncio = () => {
    setShowMegaSale(false);
    // Simula que el anuncio terminó (puedes poner aquí tu lógica real)
    setTimeout(() => setShowDescuento(true), 1000); // 1 segundo de espera
  };

  const handleVerOtroAnuncio = () => {
    setShowDescuento(false);
    setShowMegaSale(true);
  };

  const handlePagar = async () => {
    setShowMegaSale(false);
    setShowDescuento(false);
    // Aquí puedes poner tu lógica de pago (MercadoPago, etc)
    router.push("/mercadopago");
    // Después de pago exitoso, notifica por correo
    await notificarEnvioPorCorreo();
  };

  // Función para enviar notificación por correo
  const notificarEnvioPorCorreo = async () => {
    try {
      await fetch("/api/notificar-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitente,
          destinatario,
          cotizador,
          fecha,
        }),
      });
    } catch (error) {
      // Puedes mostrar un toast o alert si falla, pero no es obligatorio
      console.error("Error enviando notificación de envío:", error);
    }
  };

  const handleVerAnuncios = () => {
    if (window.AndroidInterface && window.AndroidInterface.showRewardedAd) {
      setAdState("loading");
      window.AndroidInterface.showRewardedAd();
      return;
    }
    alert("Esta función solo está disponible en la app móvil.");
  };

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

  // Utilidades para mostrar nombres de ciudades
  const ciudades = {
    "11001": "Bogotá D.C.",
    "25001": "Funza",
    "25019": "Mosquera",
    "25040": "Madrid",
    "25148": "Cota",
    "25175": "Chía",
    "25183": "Cajicá",
    "25189": "La Calera",
    "25785": "Tabio",
    "25740": "Soacha",
    "25743": "Sibaté",
  };

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
                ${Number(cotizador.costoTotal).toLocaleString("es-CO")}
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
            {/* Resumen del pedido */}
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
                {cotizador.numeroGuia && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#41e0b3]">N° Guía</span>
                    <span className="text-white font-mono">#{cotizador.numeroGuia}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-[#41e0b3]/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#41e0b3]">Total</span>
                  <span className="text-2xl font-extrabold text-white drop-shadow">
                    ${Number(cotizador.costoTotal).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handlePagar}
                  className="w-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#2bbd8c] hover:to-[#41e0b3] text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 animate-bounce"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Proceder al pago</span>
                </button>
                <button
                  onClick={handleVerAnuncios}
                  className="w-full bg-[#23272b] hover:bg-[#41e0b3]/20 text-[#41e0b3] font-bold py-3 px-6 rounded-2xl shadow transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Reducir costo</span>
                </button>
              </div>
              <p className="text-xs text-[#41e0b3] text-center mt-4">
                Ve anuncios para obtener descuentos en tu envío
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MEGA SALE */}
      <MegaSaleModal
        open={showMegaSale}
        onClose={() => setShowMegaSale(false)}
        onPay={() => {
          setShowMegaSale(false);
          handlePagar();
        }}
        onWatchAd={() => {
          setShowMegaSale(false);
          handleVerAnuncios();
        }}
      />

      {/* MODAL DESCUENTO ANUNCIOS */}
      <DescuentoAnunciosModal
        open={showDescuento}
        onClose={() => setShowDescuento(false)}
        onPay={() => {
          setShowDescuento(false);
          handlePagar();
        }}
        onWatchAd={() => {
          setShowDescuento(false);
          handleVerOtroAnuncio();
        }}
      />

      {/* Feedback visual de AdMob */}
      {adState === "loading" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-8 shadow text-center">
            <span className="block mb-2 text-lg font-bold text-[#41e0b3]">Cargando anuncio...</span>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#41e0b3] mx-auto"></div>
          </div>
        </div>
      )}
      {adState === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-8 shadow text-center">
            <span className="block mb-2 text-lg font-bold text-red-500">Error al cargar el anuncio. Intenta de nuevo.</span>
            <button
              className="bg-[#41e0b3] text-white px-4 py-2 rounded font-bold"
              onClick={() => setAdState("idle")}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}