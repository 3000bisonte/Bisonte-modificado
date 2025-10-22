"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState, useCallback, useRef } from "react";

import { useNotification } from "../hooks/useNotification";

import NotificationModal from "./NotificationModal";
const PagarComponent = ({ saldo: _saldo, onRecargarSaldo: _onRecargarSaldo, onPagarAhora: _onPagarAhora, onClick: _onClick }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showModal, _setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, _setIsLoading] = useState(false);
  const [costoTotal, setCostoTotal] = useState(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adTimeout, setAdTimeout] = useState(null); // Para manejar timeout del anuncio
  const [userCancelledAd, setUserCancelledAd] = useState(false); // Flag para cancelación manual
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_messages, _setMessages] = useState([]);
  const [port, setPort] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [adCount, setAdCount] = useState(0);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [perfilId, setPerfilId] = useState(null); // Estado para guardar el perfilId
  const perfilLoaded = useRef(false); // Para evitar cargas múltiples del perfil

  const router = useRouter();
  const { data: session } = useSession();

  // 🎨 Modal de notificaciones
  const { modalState, showSuccess, showError, showWarning, closeModal } = useNotification();

  useEffect(() => {
    router.prefetch?.("/mercadopago");
  }, [router]);

  useEffect(() => {
    const savedAdCount = localStorage.getItem("adCount");
    if (savedAdCount) {
      setAdCount(parseInt(savedAdCount, 10));
    }
    const savedCotizacionDataString = localStorage.getItem("cotizacion");
    if (savedCotizacionDataString) {
      try {
        // 3. Parsear el string JSON a un objeto JavaScript
        const parsedData = JSON.parse(savedCotizacionDataString);

        // 4. Verificar si el objeto parseado existe y si tiene la propiedad 'costoTotal' como número
        if (parsedData && typeof parsedData.costoTotal === "number") {
          // 5. Establecer el estado 'costoTotal' con el valor numérico extraído
          setCostoTotal(parsedData.costoTotal);
          console.log(
            "Costo total cargado desde localStorage (cotizacion.costoTotal):",
            parsedData.costoTotal
          );
        } else {
          // Manejar caso: el objeto no tiene 'costoTotal' o no es un número
          console.warn(
            "El objeto 'cotizacion' parseado no contiene un 'costoTotal' numérico válido:",
            parsedData
          );
          setCostoTotal(null); // Indicar que el costo no está disponible
        }
      } catch (error) {
        // Manejar caso: el string guardado no es JSON válido
        console.error(
          "Error al parsear 'cotizacion' desde localStorage:",
          error
        );
        setCostoTotal(null); // Indicar que el costo no está disponible
      }
    } else {
      // Manejar caso: no se encontró el item "cotizacion" en localStorage
      console.warn("No se encontró el item 'cotizacion' en localStorage.");
      setCostoTotal(null); // Indicar que el costo no está disponible
      // Opcional: Redirigir si es necesario
      // router.push('/cotizador');
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      const port = event.ports[0];
      if (!port) {return;}

      setPort(port);
      port.postMessage("test");

      port.onmessage = (event) => {
        try {
          const messageData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

          if (messageData?.type === "reward") {
            // 🚀 Cerrar modal de carga cuando se complete el anuncio
            console.log("💰 Recompensa recibida - cerrando modal");
            setIsAdLoading(false);
            setAdTimeout(null);
            setUserCancelledAd(false); // Reset flag
            
            const originalReward = messageData.amount;
            const bonusAmount = 10000;
            const totalDiscount = originalReward + bonusAmount;
            console.log(
              `Recompensa original: ${originalReward}, Bono: ${bonusAmount}, Descuento total a aplicar: ${totalDiscount}`
            );
            setCostoTotal((prevCostoTotal) => {
              // Solo proceder si hay un costo inicial válido
              if (
                prevCostoTotal === null ||
                typeof prevCostoTotal !== "number"
              ) {
                console.warn(
                  "Intento de aplicar descuento sin costo total inicial válido."
                );
                return prevCostoTotal; // No cambiar nada si no hay costo inicial
              }

              // Calcular el nuevo costo, asegurando que no sea negativo
              const newCostoTotal = Math.max(
                0,
                prevCostoTotal - originalReward
              );
              console.log(
                `Aplicando descuento: ${originalReward}. Nuevo costo: ${newCostoTotal}`
              );

              // --- INICIO DE LA LÓGICA CORRECTA PARA ACTUALIZAR LOCALSTORAGE ---
              try {
                // 1. Leer el objeto 'cotizacion' actual de localStorage
                const savedCotizacionString =
                  localStorage.getItem("cotizacion");

                if (savedCotizacionString) {
                  // 2. Parsear el objeto
                  const cotizacionData = JSON.parse(savedCotizacionString);

                  // 3. Actualizar la propiedad 'costoTotal' DENTRO del objeto
                  cotizacionData.costoTotal = newCostoTotal;

                  // 4. Volver a convertir el objeto MODIFICADO a string
                  const updatedCotizacionString =
                    JSON.stringify(cotizacionData);

                  // 5. Guardar el string del objeto MODIFICADO de vuelta en localStorage bajo la clave 'cotizacion'
                  localStorage.setItem("cotizacion", updatedCotizacionString);
                  console.log(
                    "Objeto 'cotizacion' actualizado en localStorage con nuevo costo."
                  );
                } else {
                  // Manejar caso donde 'cotizacion' no se encontró (inesperado en este punto)
                  console.warn(
                    "No se encontró el objeto 'cotizacion' en localStorage para actualizar el descuento."
                  );
                  // Como fallback MUY BÁSICO, podrías intentar guardar solo el costo, pero no es ideal
                  // localStorage.setItem("costoTotal", newCostoTotal); // No recomendado si 'cotizacion' debería existir
                }
              } catch (error) {
                console.error(
                  "Error al actualizar 'costoTotal' dentro de 'cotizacion' en localStorage:",
                  error
                );
                // Fallback muy básico si falla el parseo/stringify
                // localStorage.setItem("costoTotal", newCostoTotal); // No recomendado
              }
              // --- FIN DE LA LÓGICA CORRECTA ---

              // Devolver el nuevo costo para actualizar el estado local del componente PagarComponent
              return newCostoTotal;
            });
          } else if (
            messageData?.type === "adStatus" &&
            messageData.status === "ready"
          ) {
            // 🚀 Cerrar modal cuando el anuncio está listo
            console.log("📺 Anuncio listo - cerrando modal");
            setIsAdLoading(false);
            setAdTimeout(null);
            setUserCancelledAd(false); // Reset flag
          }
        } catch (error) {
          console.error("Error al procesar el mensaje:", error);
        }
      };
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 🚀 useEffect para garantizar que el modal se cierre
  useEffect(() => {
    console.log("🔍 Estado isAdLoading cambió a:", isAdLoading);
    if (!isAdLoading && adTimeout) {
      // Limpiar timeout cuando el modal se cierre
      setAdTimeout(null);
    }
  }, [isAdLoading, adTimeout]);

  useEffect(() => {
    const loadPerfil = async () => {
      if (!session?.user?.email || perfilLoaded.current) {
        return; // Salir si no hay email o ya se cargó
      }
      try {
        const response = await fetch("/api/perfil", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {throw new Error("Error al obtener el perfil");}
        const data = await response.json();
        const dataArray = Array.isArray(data) ? data : [];
        const perfil = dataArray.find((perf) => perf.correo === session.user.email);
        if (perfil) {
          setPerfilId(perfil.id); // Guarda el id en el estado
          perfilLoaded.current = true; // Marca como cargado
          console.log("Perfil ID cargado en PagarComponent:", perfil.id);
        } else {
          console.warn(
            "Perfil no encontrado para el email:",
            session.user.email
          );
        }
      } catch (error) {
        console.error("Error al cargar el perfil en PagarComponent:", error);
        // Considera mostrar un mensaje al usuario si el perfil es crucial
      }
    };
    loadPerfil();
  }, [session]);
  // 🚀 Función SIMPLE para cerrar modal
  const cancelAdLoading = () => {
    console.log("🚫 CERRANDO MODAL - MÉTODO SIMPLE");
    setIsAdLoading(false);
  };

  const handleReduceShipping = () => {
    if (process.env.NODE_ENV === "development") {
      // Chequeo si estás en entorno de desarrollo
      console.log("MODO DEV: Simulando recompensa...");
      setIsAdLoading(true); // Muestra "Cargando..."
      setTimeout(() => {
        // Simula el mensaje que recibirías de la app Android
        const fakeRewardAmount = 15; // O el valor que AdMob suele dar
        // Llama directamente a la lógica que procesa la recompensa
        // (Asegúrate que la lógica dentro de setCostoTotal esté disponible o extráela)
        setCostoTotal((prevCostoTotal) => {
          if (prevCostoTotal === null || typeof prevCostoTotal !== "number")
            {return prevCostoTotal;}

          // --- INICIO: Lógica temporal para sumar bono (SI LA USAS) ---
          const bonusAmount = 10000;
          const totalDiscount = fakeRewardAmount + bonusAmount;
          // --- FIN: Lógica temporal ---
          // const totalDiscount = fakeRewardAmount; // Si no usas bono

          const newCostoTotal = Math.max(0, prevCostoTotal - totalDiscount);
          console.log(
            `Aplicando descuento SIMULADO: ${totalDiscount}. Nuevo costo: ${newCostoTotal}`
          );
          // Actualizar localStorage aquí también si es necesario
          // ... (lógica localStorage) ...
          return newCostoTotal;
        });

        setIsAdLoading(false);
      }, 2000); // Simula un retraso de 2 segundos
    } else {
      if (!isAdLoading) {
        setIsAdLoading(true);
        
        // 🚀 Timeout opcional para indicar que está tardando (pero botón ya está disponible)
        const timeoutId = setTimeout(() => {
          console.log("⏰ Anuncio tardando más de lo esperado");
          setAdTimeout(true); // Solo para logging, botón ya está disponible
        }, 5000); // 5 segundos
        
        if (port) {
          port.postMessage("iniciarVideo");
          setAdCount((prevAdCount) => {
            const newAdCount = prevAdCount + 1;
            localStorage.setItem("adCount", newAdCount);
            return newAdCount;
          });
        } else {
          console.log("No hay puerto de mensajes disponible");
          // Si no hay puerto, limpiar timeout inmediatamente
          clearTimeout(timeoutId);
          setAdTimeout(true);
        }
      }
    }
  };
  const generarNumeroGuia = () => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = ("0" + (fecha.getMonth() + 1)).slice(-2);
    const dia = ("0" + fecha.getDate()).slice(-2);
    const parteAleatoria = Math.random().toString(36).slice(2, 6).toUpperCase();
    const numeroGuia = `GUIA-${anio}${mes}${dia}-${parteAleatoria}`;
    return numeroGuia;
  };
  const handleFreeShipment = useCallback(async () => {
    if (!perfilId) {
      console.error("No se puede registrar el envío: Falta perfilId.");
      showError('Error de Perfil', 'Error al obtener tus datos de perfil. Intenta recargar la página.');
      setIsCreatingShipment(false);
      return;
    }

    if (costoTotal === null || costoTotal > 0) {
      console.error("Intento de envío gratuito con costo > 0 o nulo.");
      setIsCreatingShipment(false);
      return;
    }

    setIsCreatingShipment(true);
    console.log("🆓 Iniciando registro de envío gratuito...");

    const numeroGuia = generarNumeroGuia();
    
    try {
      const formDataString = localStorage.getItem("destinatarioInfo");
      const remitenteString = localStorage.getItem("formDataRemitente");
      const cotizacionString = localStorage.getItem("cotizacion");

      if (!formDataString || !remitenteString) {
        throw new Error("Faltan datos necesarios del envío en localStorage.");
      }

      const destinatarioLocal = JSON.parse(formDataString);
      const remitenteLocal = JSON.parse(remitenteString);
      const cotizacionLocal = cotizacionString ? JSON.parse(cotizacionString) : {};

      const sanitizeTelefono = (raw) => {
        if (!raw) {return "0000000000";}
        const digits = String(raw).replace(/\D/g, "");
        if (!digits) {return "0000000000";}
        return (digits.length >= 10 ? digits.slice(0, 10) : digits.padEnd(10, "0"));
      };

      const ensureText = (value, fallback, minLength) => {
        const text = typeof value === "string" ? value.trim() : "";
        if (text.length >= minLength) {return text;}
        return fallback;
      };

      const destinatarioNombre = ensureText(
        `${destinatarioLocal?.nombre ?? ""} ${destinatarioLocal?.apellido ?? ""}`.trim(),
        "Destinatario",
        2
      );

      const remitenteNombre = ensureText(
        `${remitenteLocal?.nombre ?? ""} ${remitenteLocal?.apellido ?? ""}`.trim(),
        "Remitente",
        2
      );

      const destinoDireccion = ensureText(
        destinatarioLocal?.direccionEntrega,
        "Dirección destino pendiente",
        5
      );

      const origenDireccion = ensureText(
        remitenteLocal?.direccionRecogida,
        "Dirección origen pendiente",
        5
      );

      const peso = Number(cotizacionLocal?.peso) > 0 ? Number(cotizacionLocal.peso) : 1;
      const valorDeclarado = Number(cotizacionLocal?.valorDeclarado) >= 0 ? Number(cotizacionLocal.valorDeclarado) : 0;
      const dimensiones = [cotizacionLocal?.largo, cotizacionLocal?.ancho, cotizacionLocal?.alto]
        .map((value) => {
          const numeric = Number(value);
          return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
        })
        .join("x");

      const montoTotal = Number.isFinite(Number(cotizacionLocal?.costoTotal)) ? Number(cotizacionLocal.costoTotal) : 0;

      const envioData = {
        NumeroGuia: numeroGuia,
        Estado: "RECOLECCION_PENDIENTE",
        Origen: origenDireccion,
        Destino: destinoDireccion,
        Destinatario: {
          Nombre: destinatarioNombre,
          Direccion: destinoDireccion,
          Telefono: sanitizeTelefono(destinatarioLocal?.telefono || destinatarioLocal?.celular),
        },
        Remitente: {
          Nombre: remitenteNombre,
          Direccion: origenDireccion,
          Telefono: sanitizeTelefono(remitenteLocal?.telefono || remitenteLocal?.celular),
        },
        Peso: peso,
        Dimensiones: dimensiones,
        ValorDeclarado: valorDeclarado,
        usuarioEmail: session?.user?.email ?? null,
        metodoPago: "GRATUITO",
        pagado: true,
        montoTotal,
        paymentId: `FREE-${Date.now()}`,
      };

      console.log("📋 Datos del envío gratuito:", envioData);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envioData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("✅ Envío gratuito registrado exitosamente:", responseData);

        localStorage.setItem("envioDatos", JSON.stringify(responseData));
        localStorage.setItem("envioExitoso", "true");

        showSuccess('¡Envío Registrado! 🎉', '¡Envío gratuito realizado exitosamente! Serás redirigido a Mis Envíos.');

        setTimeout(() => {
          router.push("/misenvios");
        }, 2000);
      } else {
        console.error("❌ Error al registrar el envío gratuito: Status", response.status, responseData);
        const errorMessage = responseData?.message || responseData?.error || 'Hubo un problema al registrar tu envío.';
        showError('Error al Registrar', `Hubo un problema al registrar tu envío (Estado: ${response.status}). ${errorMessage}`);
      }
    } catch (error) {
      console.error("❌ Error de red al registrar el envío gratuito:", error);
      showError('Error de Conexión', 'Hubo un problema de conexión al registrar tu envío. Por favor, inténtalo de nuevo.');
    } finally {
      setIsCreatingShipment(false);
    }
  }, [perfilId, router, costoTotal, session?.user?.email, showSuccess, showError]);
  const handleClick = () => {
    // Asegurarse que costoTotal no sea null antes de comparar
    if (costoTotal !== null && costoTotal <= 0) {
      // Costo es cero o menos, manejar envío gratuito
      if (!isCreatingShipment) {
        // Evitar doble click
        handleFreeShipment();
      }
    } else if (costoTotal !== null && costoTotal > 0) {
      // Costo es positivo, ir a Mercado Pago
      if (!isLoading) {
        // Usar isLoading si es para el botón de pago normal
        router.push("/mercadopago");
      }
    } else {
      // costoTotal es null (aún cargando o error al cargar)
      console.warn("Intento de pagar con costoTotal nulo.");
      showWarning('Costo No Disponible', 'Espera a que cargue el costo del envío o calcula el costo primero.');
    }
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col justify-center items-center">
      <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 sm:text-4xl">
        Paga tu envío
      </h2>
      <div className="flex flex-col w-full max-w-sm items-center space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4 space-x-4">
          <Image
            src="/LogoNew.jpeg"
            alt="Logo de BisonteApp"
            width={80}
            height={80}
            className="rounded-full object-contain"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Bisonte</h2>
            <p className="text-teal-500 font-semibold text-lg">
              Precio:{" "}
              {costoTotal !== null
                ? costoTotal <= 0 // Añadir chequeo para mostrar "Gratis"
                  ? "¡Gratis!"
                  : `$${costoTotal.toLocaleString("es-CO", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                : "Calcula el costo"}
            </p>
          </div>
        </div>
        <div className="w-full space-y-4">
          <button
            className={`w-full py-3 text-lg font-semibold text-gray-700 rounded-lg ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-200 hover:bg-teal-600"
            } shadow-md`}
            onClick={handleClick}
            disabled={isLoading || isCreatingShipment || costoTotal === null}
          >
            {isCreatingShipment
              ? "Registrando Envío..."
              : isLoading
              ? "Procesando..."
              : costoTotal !== null && costoTotal <= 0
              ? "Confirmar Envío Gratis"
              : "Pagar"}
          </button>
         

{costoTotal !== null && costoTotal > 0 && (
  <button
    className="w-full py-3 text-lg font-semibold rounded-lg shadow-md bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
    onClick={handleReduceShipping}
    disabled={isAdLoading} // El disabled previene clics adicionales
  >
    Reducir costo viendo un video
  </button>
)}
        </div>
      </div>

      {/* Modal de carga de anuncio - SIMPLICADO PARA CERRAR FÁCIL */}
      {isAdLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 transform transition-all relative">
            
            {/* X GIGANTE PARA CERRAR - ALWAYS VISIBLE */}
            <button
              onClick={() => {
                console.log("🚫 CERRANDO MODAL FORZADAMENTE");
                setIsAdLoading(false);
              }}
              className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-xl z-50 border-4 border-white"
              style={{ zIndex: 9999 }}
            >
              ✕
            </button>

            {/* Contenido súper simple */}
            <div className="pt-4">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-lg font-bold mb-4">Cargando anuncio...</h3>
              
              <button
                onClick={() => setIsAdLoading(false)}
                className="w-full bg-red-500 text-white py-3 px-4 rounded font-bold text-lg"
              >
                CERRAR Y CONTINUAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
      />
    </div>
  );
};

export default PagarComponent;
