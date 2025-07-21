"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MegaSaleModal from "./MegaSaleModal";
import DescuentoAnunciosModal from "./DescuentoAnunciosModal";
import BottomNav from "./BottomNav";

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Función para generar número de guía
function generarNumeroGuia() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `BIS${timestamp.slice(-6)}${random}`;
}

export default function Resumen() {
  const { data: session } = useSession();
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [showRemitente, setShowRemitente] = useState(false);
  const [showDestinatario, setShowDestinatario] = useState(false);
  const [showMegaSale, setShowMegaSale] = useState(false); // ✅ Cambiado a false inicialmente
  const [showDescuento, setShowDescuento] = useState(false);
  const [adState, setAdState] = useState("idle");
  // Nuevos estados para manejo mejorado de anuncios
  const [adsAvailable, setAdsAvailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(2013); // Monto por defecto
  const adStateRef = useRef(null); // Para acceder al estado actual en timeouts
  const MAX_RETRIES = 3;
  const adTimeoutRef = useRef(null);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  const router = useRouter();

  // Estados para manejar pagos
  const [costoTotal, setCostoTotal] = useState(null);

  // Cargar datos iniciales
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

  // Actualiza la fecha en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setFecha(formatDate(new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ INICIO DEL CÓDIGO REORDENADO

  // Las funciones se mueven aquí, antes de ser usadas.
  const preloadAd = useCallback(() => {
    if (window.AndroidInterface && window.AndroidInterface.preloadRewardedAd) {
      console.log("📺 Precargando anuncio recompensado...");
      setAdState("preloading");
      adStateRef.current = "preloading";
      
      try {
        window.AndroidInterface.preloadRewardedAd();
        
        // Simular respuesta de disponibilidad (en producción, esto vendría del puente nativo)
        setTimeout(() => {
          if (adStateRef.current === "preloading") {
            console.log("✅ Anuncio precargado y listo");
            setAdsAvailable(true);
            setAdState("ready");
            adStateRef.current = "ready";
          }
        }, 2000);
      } catch (error) {
        console.error("❌ Error al precargar anuncio:", error);
        // handleAdError no se puede llamar aquí directamente por la dependencia circular
        // Se resolverá en el siguiente paso. Por ahora, solo log.
      }
    } else {
      console.log("⚠️ Interfaz de anuncios no disponible");
      setAdsAvailable(false);
    }
  }, []); // Dependencias se ajustarán después

  const handleAdError = useCallback((errorType) => {
    console.error(`❌ Error de anuncio: ${errorType}`);
    setAdState("error");
    adStateRef.current = "error";
    
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
      adTimeoutRef.current = null;
    }

    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 Reintentando en ${delay/1000}s (intento ${retryCount + 1}/${MAX_RETRIES})`);
      
      adTimeoutRef.current = setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1);
        preloadAd();
      }, delay);
    } else {
      console.log("❌ Número máximo de intentos alcanzado");
    }
  }, [retryCount, preloadAd]);

  // Ahora el useEffect que las usa.
  useEffect(() => {
    function handleRewardedAdMessage(event) {
      let data = event.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch (parseError) {
        console.log("⚠️ Error parseando mensaje:", parseError);
        return;
      }
      
      console.log("📬 Mensaje recibido del anuncio:", data);
      
      if (data && data.type === "reward" && data.status === "completed") {
        console.log("🎉 Anuncio completado exitosamente");
        setAdState("done");
        adStateRef.current = "done";
        
        const earnedReward = data.amount || rewardAmount;
        setRewardAmount(earnedReward);
        
        const cotizadorData = JSON.parse(localStorage.getItem("formCotizador"));
        if (cotizadorData && typeof cotizadorData.costoTotal === "number") {
          const nuevoCosto = Math.max(0, cotizadorData.costoTotal - earnedReward);
          cotizadorData.costoTotal = nuevoCosto;
          localStorage.setItem("formCotizador", JSON.stringify(cotizadorData));
          
          alert(`🎉 ¡Descuento aplicado!\n💰 Descuento: $${earnedReward.toLocaleString("es-CO")}\n💵 Nuevo costo: $${nuevoCosto.toLocaleString("es-CO")}`);
          
          setCotizador({ ...cotizadorData });
          setCostoTotal(nuevoCosto);
        }
        
        setTimeout(() => {
          setAdState("idle");
          adStateRef.current = "idle";
          preloadAd();
        }, 3000);
      }
      
      if (data && data.type === "adStatus") {
        switch (data.status) {
          case "loading":
            setAdState("loading");
            adStateRef.current = "loading";
            break;
          case "ready":
            setAdState("ready");
            adStateRef.current = "ready";
            setAdsAvailable(true);
            break;
          case "opened":
            setAdState("watching");
            adStateRef.current = "watching";
            break;
          case "closed":
            setAdState("idle");
            adStateRef.current = "idle";
            preloadAd();
            break;
          case "error":
            handleAdError(data.errorType || "unknown_error");
            break;
          default:
            console.log(`Estado de anuncio desconocido: ${data.status}`);
        }
      }
    }
    
    window.addEventListener("message", handleRewardedAdMessage);
    return () => window.removeEventListener("message", handleRewardedAdMessage);
  }, [handleAdError, preloadAd, rewardAmount]);

  // ✅ FIN DEL CÓDIGO REORDENADO

  // Precarga automática de anuncios al inicio
  useEffect(() => {
    // Precargar solo cuando tenemos los datos necesarios
    if (cotizador && remitente && destinatario && costoTotal !== null) {
      // Pequeño delay para no congestionar el inicio
      const timer = setTimeout(() => {
        preloadAd();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [cotizador, remitente, destinatario, costoTotal, preloadAd]);

  // Mostrar modal después de precargar el anuncio
  useEffect(() => {
    if (cotizador && remitente && destinatario && costoTotal > 0 && adState === "ready") {
      // Mostrar modal después de un pequeño delay
      const timer = setTimeout(() => {
        setShowMegaSale(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [cotizador, remitente, destinatario, costoTotal, adState]);

  // **LÓGICA DE ENVÍO GRATUITO**
  const handleFreeShipment = useCallback(async () => {
    // Verificar sesión primero
    if (!session?.user?.email) {
      console.error("❌ No hay sesión de usuario activa");
      alert("Error: No se detectó una sesión activa. Por favor, inicia sesión nuevamente.");
      return;
    }

    if (costoTotal === null || costoTotal > 0) {
      console.error("❌ Intento de envío gratuito con costo > 0 o nulo.");
      console.log("💰 Costo actual:", costoTotal);
      return;
    }

    setIsCreatingShipment(true);
    console.log("🆓 Iniciando registro de envío gratuito...");

    const numeroGuia = generarNumeroGuia();
    
    try {
      // Usar las claves correctas de localStorage
      const destinatarioString = localStorage.getItem("formDestinatario");
      const remitenteString = localStorage.getItem("formRemitente");
      
      if (!destinatarioString || !remitenteString) {
        throw new Error("Faltan datos necesarios del envío en localStorage.");
      }

      const datosDestinatario = JSON.parse(destinatarioString);
      const datosRemitente = JSON.parse(remitenteString);

      // Validar que los datos necesarios existen
      if (!datosDestinatario.nombre || !datosDestinatario.direccionEntrega) {
        throw new Error("Datos del destinatario incompletos");
      }
      
      if (!datosRemitente.nombre || !datosRemitente.direccionRecogida) {
        throw new Error("Datos del remitente incompletos");
      }

      const nombreCompleto = datosDestinatario.nombre;
      const direccionEntrega = datosDestinatario.direccionEntrega;
      const nombreRemitente = datosRemitente.nombre;
      const direccionRecogida = datosRemitente.direccionRecogida;

      console.log("📋 Datos del envío gratuito:", {
        numeroGuia,
        origen: direccionRecogida,
        destino: direccionEntrega,
        destinatario: nombreCompleto,
        remitente: nombreRemitente,
        usuarioEmail: session.user.email
      });

      const envioData = {
        numeroGuia,
        paymentId: `FREE-${Date.now()}`,
        origen: direccionRecogida,
        destino: direccionEntrega,
        destinatario: nombreCompleto,
        remitente: nombreRemitente,
        usuarioEmail: session.user.email,
        tipo: "gratuito"
      };

      const response = await fetch("/api/guardarenvio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envioData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Envío gratuito registrado exitosamente:", responseData);
        
        localStorage.setItem("envioDatos", JSON.stringify(responseData));
        localStorage.setItem("envioExitoso", "true");
        
        alert("¡Envío gratuito realizado exitosamente! Espere pronta actualización.");
        
        setTimeout(() => {
          router.push("/misenvios");
        }, 2000);
        
      } else {
        console.error("❌ Error al registrar el envío gratuito: Status", response.status);
        const errorData = await response.text();
        console.error("Detalle del error:", errorData);
        alert(`Hubo un problema al registrar tu envío (Estado: ${response.status}). Por favor, contacta a soporte.`);
      }
    } catch (error) {
      console.error("❌ Error de red al registrar el envío gratuito:", error);
      alert("Hubo un problema de conexión al registrar tu envío. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCreatingShipment(false);
    }
  }, [router, costoTotal, session?.user?.email]);

  // **MANEJO DE PAGO REGULAR**
  const handlePagar = async () => {
    setShowMegaSale(false);
    setShowDescuento(false);
    
    // Si el costo es 0, procesar como envío gratuito
    if (costoTotal === 0) {
      console.log("💰 Costo es 0, procesando como envío gratuito...");
      await handleFreeShipment();
      return;
    }
    
    // Si hay costo, ir a MercadoPago
    console.log("💳 Costo > 0, redirigiendo a MercadoPago...");
    router.push("/mercadopago");
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
      console.error("❌ Error enviando notificación de envío:", error);
    }
  };

  // ✅ Función mejorada para ver anuncios
  const handleVerAnuncios = useCallback(() => {
    // Verificar que hay costo para reducir
    if (costoTotal <= 0) {
      alert("¡Tu envío ya es gratuito! 🎉");
      return;
    }
    
    // Verificar si los anuncios están disponibles
    if (!adsAvailable) {
      // Si no están disponibles, intentar precargarlos
      setRetryCount(0); // Reiniciar contador de intentos
      preloadAd();
      alert("📱 Preparando anuncio. Por favor espera unos segundos...");
      return;
    }
    
    // Mostrar el anuncio si está disponible
    if (window.AndroidInterface && window.AndroidInterface.showRewardedAd) {
      console.log("📺 Mostrando anuncio recompensado...");
      setAdState("loading");
      adStateRef.current = "loading";
      
      try {
        window.AndroidInterface.showRewardedAd();
        
        // Timeout de seguridad mejorado
        if (adTimeoutRef.current) {
          clearTimeout(adTimeoutRef.current);
        }
        
        adTimeoutRef.current = setTimeout(() => {
          if (adStateRef.current === "loading") {
            handleAdError("timeout");
          }
        }, 8000); // 8 segundos timeout
      } catch (error) {
        console.error("❌ Error al mostrar anuncio:", error);
        handleAdError("show_error");
      }
      
      return;
    }
    
    // Fallback para web o cuando la interfaz no está disponible
    alert("📱 Los anuncios solo están disponibles en la app móvil.\n💡 Descarga la app para obtener descuentos en tus envíos.");
  }, [adsAvailable, costoTotal, handleAdError, preloadAd]);

  // Función para ver otro anuncio (desde el modal de descuento)
  const handleVerOtroAnuncio = useCallback(() => {
    setShowDescuento(false);
    
    // Pequeño delay antes de mostrar otro anuncio
    setTimeout(() => {
      // Verificar nuevamente la disponibilidad
      if (adsAvailable) {
        handleVerAnuncios();
      } else {
        // Si no hay anuncios disponibles, intentar precargar
        preloadAd();
        alert("Preparando tu próximo anuncio. Inténtalo nuevamente en unos segundos.");
      }
    }, 500);
  }, [adsAvailable, handleVerAnuncios, preloadAd]);

  // Modificar handleVerAnuncio para el botón del MegaSaleModal
  const handleVerAnuncio = useCallback(() => {
    setShowMegaSale(false);
    
    // Si los anuncios están disponibles, mostrar el modal de descuento
    // Si no, intentar precargar y mostrar mensaje
    if (adsAvailable) {
      setTimeout(() => setShowDescuento(true), 300);
    } else {
      preloadAd();
      alert("Preparando anuncios. Intenta nuevamente en unos segundos.");
    }
  }, [adsAvailable, preloadAd]);

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
    };
  }, []);

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
                {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || cotizador.costoTotal).toLocaleString("es-CO")}`}
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
              
              {/* Debug info - solo en desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-2 mb-4 text-xs">
                  <p className="text-yellow-400">Debug:</p>
                  <p className="text-white">Email: {session?.user?.email || "No disponible"}</p>
                  <p className="text-white">Costo: {costoTotal}</p>
                </div>
              )}
              
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
                    {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || cotizador.costoTotal).toLocaleString("es-CO")}`}
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
                    onClick={handleVerAnuncios}
                    disabled={adState === "loading" || adState === "preloading"}
                    className={`w-full ${
                      adsAvailable 
                        ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                        : "bg-[#23272b]"
                    } hover:bg-[#41e0b3]/20 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all duration-300 flex items-center justify-center gap-2 ${
                      (adState === "loading" || adState === "preloading") ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {adState === "preloading" || adState === "loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Preparando anuncio...</span>
                      </>
                    ) : adsAvailable ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Ver anuncio para descuento</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Reducir costo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {costoTotal > 0 && (
                <p className="text-xs text-[#41e0b3] text-center mt-4">
                  💡 Ve anuncios para obtener descuentos en tu envío
                </p>
              )}
              
              {costoTotal === 0 && (
                <p className="text-xs text-green-400 text-center mt-4">
                  🎉 ¡Tu envío es completamente gratuito!
                </p>
              )}
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

        {/* MODAL MEGA SALE */}
        <MegaSaleModal
          open={showMegaSale}
          onClose={() => setShowMegaSale(false)}
          onPay={() => {
            setShowMegaSale(false);
            handlePagar();
          }}
          onWatchAd={handleVerAnuncio} // ✅ Cambiar a handleVerAnuncio para evitar bucle
        />

        {/* MODAL DESCUENTO ANUNCIOS */}
        <DescuentoAnunciosModal
          open={showDescuento}
          onClose={() => setShowDescuento(false)}
          onPay={() => {
            setShowDescuento(false);
            handlePagar();
          }}
          onWatchAd={handleVerOtroAnuncio}
        />

        {/* Feedback visual de AdMob */}
        {adState === "loading" && (
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
              <p className="text-sm text-gray-600">Tu nuevo costo se reflejará en breve</p>
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
              <p className="text-sm text-gray-600 mb-4">Intenta de nuevo o verifica tu conexión</p>
              <button
                className="bg-[#41e0b3] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2bbd8c] transition-colors"
                onClick={preloadAd} // <-- CAMBIO: Llama a preloadAd directamente
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