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
            setIsAdLoading(false);
            setAdTimeout(null);
            
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
            setIsAdLoading(false);
            setAdTimeout(null);
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
  // 🚀 Función para cancelar anuncio
  const cancelAdLoading = () => {
    console.log("🚫 Usuario canceló carga de anuncio");
    setIsAdLoading(false);
    setAdTimeout(null);
    showInfo(
      'Anuncio cancelado',
      'Puedes proceder con el pago sin descuento o intentar el anuncio más tarde.'
    );
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
        
        // 🚀 Agregar timeout para permitir cancelar anuncio
        const timeoutId = setTimeout(() => {
          console.log("⏰ Timeout de anuncio - permitir cancelar");
          setAdTimeout(true);
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

      {/* Modal de carga de anuncio */}
      {isAdLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 transform transition-all relative">
            {/* Botón de cerrar (X) - disponible después del timeout */}
            {adTimeout && (
              <button
                type="button"
                onClick={cancelAdLoading}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 group z-10"
                aria-label="Cerrar y continuar sin anuncio"
                title="Cerrar y continuar sin descuento"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            
            {/* Icono animado */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-[#41e0b3] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#41e0b3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] bg-clip-text text-transparent">
                Cargando anuncio
              </span>
            </h3>

            {/* Mensaje de estado */}
            <p className="text-gray-600 text-sm mb-4">
              {adTimeout ? (
                <>
                  El anuncio está tardando más de lo esperado.
                  <br />
                  <span className="text-xs text-gray-500 mt-1 block">
                    Puedes cerrar este aviso y continuar sin descuento
                  </span>
                </>
              ) : (
                <>
                  Esto puede tardar unos segundos...
                  <br />
                  <span className="text-xs text-gray-500 mt-1 block">
                    El anuncio se está cargando en segundo plano
                  </span>
                </>
              )}
            </p>

            {/* Botón para cancelar cuando hay timeout */}
            {adTimeout && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={cancelAdLoading}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                >
                  ⏭️ Continuar sin descuento
                </button>
              </div>
            )}

            {/* Tips mientras espera */}
            {!adTimeout && (
              <div className="mt-4">
                <div className="p-3 bg-gradient-to-r from-[#41e0b3]/10 to-[#2bbd8c]/10 rounded-lg border border-[#41e0b3]/20">
                  <p className="text-xs text-gray-600">
                    💡 <span className="font-semibold">¿Sabías?</span> Ver anuncios te da hasta{" "}
                    <span className="font-bold text-[#2bbd8c]">$15,000 de descuento</span> en tu envío
                  </p>
                </div>
              </div>
            )}
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
