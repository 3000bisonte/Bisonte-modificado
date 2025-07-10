"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
const PagarComponent = ({ saldo, onRecargarSaldo, onPagarAhora, onClick }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [costoTotal, setCostoTotal] = useState(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [port, setPort] = useState(null);
  const [adCount, setAdCount] = useState(0);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [perfilId, setPerfilId] = useState(null); // Estado para guardar el perfilId
  const perfilLoaded = useRef(false); // Para evitar cargas múltiples del perfil

  const router = useRouter();
  const { data: session } = useSession();

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
      if (!port) return;

      setPort(port);
      port.postMessage("test");

      port.onmessage = (event) => {
        try {
          const messageData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

          if (messageData?.type === "reward") {
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
            setIsAdLoading(false);
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
        if (!response.ok) throw new Error("Error al obtener el perfil");
        const data = await response.json();
        const perfil = data.find((perf) => perf.correo === session.user.email);
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
            return prevCostoTotal;

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
        if (port) {
          port.postMessage("iniciarVideo");
          setAdCount((prevAdCount) => {
            const newAdCount = prevAdCount + 1;
            localStorage.setItem("adCount", newAdCount);
            return newAdCount;
          });
        } else {
          console.log("No hay puerto de mensajes disponible");
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
      alert("Error al obtener tus datos de perfil. Intenta recargar la página.");
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
      
      if (!formDataString || !remitenteString) {
        throw new Error("Faltan datos necesarios del envío en localStorage.");
      }

      const datosLocalStorage = JSON.parse(formDataString);
      const datosLocalStorageformDataRemitente = JSON.parse(remitenteString);

      const nombreCompleto = `${datosLocalStorage.nombre} ${datosLocalStorage.apellido}`;
      const direccionEntrega = datosLocalStorage.direccionEntrega;
      const direccionRecogida = datosLocalStorageformDataRemitente.direccionRecogida;

      console.log("📋 Datos del envío gratuito:", {
        numeroGuia,
        origen: direccionRecogida,
        destino: direccionEntrega,
        destinatario: nombreCompleto,
        usuarioEmail: session?.user?.email,
      });

      const response = await fetch("/api/guardarenvio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroGuia,
          paymentId: `FREE-${Date.now()}`,
          origen: direccionRecogida,
          destino: direccionEntrega,
          destinatario: nombreCompleto,
          usuarioEmail: session?.user?.email,
        }),
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
  }, [perfilId, router, costoTotal, session?.user?.email]);
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
      alert(
        "Espera a que cargue el costo del envío o calcula el costo primero."
      );
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
            src="/logo-bisonte-512x512.png"
            alt="Logo de Bisonte"
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
    className={`
      w-full py-3 text-lg font-semibold rounded-lg shadow-md
      transition-all duration-150 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      flex items-center justify-center // Para centrar el contenido (spinner y texto)
      ${
        isAdLoading
          ? "bg-green-500 text-white opacity-75 cursor-wait" // Verde atenuado, texto blanco, cursor de espera
          : "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500" // Estado normal y hover
      }
    `}
    onClick={handleReduceShipping}
    disabled={isAdLoading} // El disabled previene clics adicionales
  >
    {isAdLoading ? (
      <> {/* Fragmento para agrupar spinner y texto */}
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Cargando anuncio...</span>
      </>
    ) : (
      "Reducir costo viendo un video"
    )}
  </button>
)}
        </div>
      </div>
    </div>
  );
};

export default PagarComponent;
