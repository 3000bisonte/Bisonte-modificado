"use client";
import React, { useEffect, useState, useRef } from "react";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import InternalProvider from "../app/ContextProvider";
import Screen from "@/components/BrickStatusScreen";
import classnames from "classnames";
import "../styles/mercadopago.css";
import { signIn, useSession, signOut } from "next-auth/react";
//import { guardarEnviosRequest } from "../../api/avu.api";// en mi csao guarar para el historial

const initMPago = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
console.log("initMPago", initMPago);
const apiServer = process.env.NEXT_PUBLIC_API_SERVER_URL;
initMercadoPago(initMPago, {
  locale: "es-CL",
});

const MercadoPagoComponent = () => {
  const { data: session } = useSession();
  const [paymentId, setpaymentId] = useState(null);
  const [status, setstatus] = useState(null);
  const [isVisiblePayments, setIsVisiblePayments] = React.useState(true);
  const [miperfil, setMiperfil] = useState([]);
  const [perfilId, setPerfilId] = useState(null);
  const perfilIdRef = useRef(null); // Usa un ref para evitar re-renderizados
  const perfilLoaded = useRef(false);

  const userEmail = session?.user?.email; // Extrae el email al inicio del componente
  const [initializationConfig, setInitializationConfig] = useState(null); // Para guardar { amount: XXX }
  const [isLoadingAmount, setIsLoadingAmount] = useState(true); // Para mostrar "Cargando..."
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    setIsLoadingAmount(true); // Indicar que empezamos a cargar
    setInitError(null); // Limpiar errores previos
    setInitializationConfig(null); // Limpiar config previa

    // Solo ejecutar en el navegador donde existe localStorage
    if (typeof window !== "undefined") {
      // Leer el OBJETO COMPLETO de cotización
      const savedCotizacionDataString = localStorage.getItem("cotizacion");

      if (savedCotizacionDataString) {
        try {
          // Parsear el objeto
          const parsedData = JSON.parse(savedCotizacionDataString);

          // Validar y extraer el costoTotal
          if (
            parsedData &&
            typeof parsedData.costoTotal === "number" &&
            parsedData.costoTotal >= 0
          ) {
            const amount = parsedData.costoTotal; // ¡Este es el valor correcto!
            console.log(
              "Monto correcto cargado para inicializar Mercado Pago:",
              amount
            );
            // Guardar la configuración en el ESTADO
            setInitializationConfig({ amount: amount });
          } else {
            console.error(
              "El 'costoTotal' en 'cotizacion' no es un número válido:",
              parsedData?.costoTotal
            );
            setInitError(
              "Error: No se pudo obtener un monto válido para el pago."
            );
          }
        } catch (error) {
          console.error(
            "Error al parsear 'cotizacion' de localStorage:",
            error
          );
          setInitError("Error al leer los datos guardados de la cotización.");
        }
      } else {
        console.error("No se encontró 'cotizacion' en localStorage.");
        setInitError(
          "No se encontraron los datos de la cotización para el pago."
        );
      }
    } else {
      setInitError(
        "Error: Entorno no compatible (localStorage no disponible)."
      );
    }

    setIsLoadingAmount(false); // Indicar que terminamos de intentar cargar
  }, []);
  // Cargar el perfil solo si no ha sido cargado
  useEffect(() => {
    const loadPerfil = async () => {
      try {
        const response = await fetch("/api/perfil", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Error al obtener el perfil");

        const data = await response.json();
        const perfil = data.find((perf) => perf.correo === userEmail);

        if (perfil) {
          perfilIdRef.current = perfil.id; // Guarda el id en el ref
          perfilLoaded.current = true; // Marca que ya se cargó el perfil
        }
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      }
    };

    // Ejecuta solo si no se ha cargado el perfil y hay email disponible
    if (userEmail && !perfilLoaded.current) {
      loadPerfil();
    }
  }, [userEmail]);

  const generarNumeroGuia = () => {
    // Obtener la fecha actual
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = ("0" + (fecha.getMonth() + 1)).slice(-2); // Asegura que siempre tenga dos dígitos
    const dia = ("0" + fecha.getDate()).slice(-2);

    // Generar una parte aleatoria (puedes usar otras estrategias, como incrementos automáticos)
    const parteAleatoria = Math.random().toString(36).slice(2, 6).toUpperCase();

    // Combinar todo para formar el número de guía
    const numeroGuia = `GUIA-${anio}${mes}${dia}-${parteAleatoria}`;

    return numeroGuia;
  };
  const paymentMethods = classnames("shopping-cart dark", {
    "shopping-cart--hidden": !isVisiblePayments,
  });
  useEffect(() => {
    if (paymentId) setIsVisiblePayments(false);
  }, [paymentId]);
  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
    console.log("formData----->", formData);

    return new Promise((resolve, reject) => {
      fetch("/api/mercadopago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())

        .then((payment) => {
          setpaymentId(payment.id);
          setstatus(payment.status); //approved

          //console.log("response-DESDE-FRONT**************************************************",payment)
          resolve();
        })
        .catch((error) => {
          reject();
        });
    });
  };
  useEffect(() => {
    console.log("Estado del pago:", status);
  }, [status]);

  // Función que maneja el envío aprobado
  const manejarEnvioAprobado = React.useCallback(async () => {
    const numeroGuia = generarNumeroGuia();
    
    try {
      const datosLocalStorage = JSON.parse(localStorage.getItem("destinatarioInfo"));
      const datosLocalStorageformDataRemitente = JSON.parse(
        localStorage.getItem("formDataRemitente")
      );
      const nombreCompleto = `${datosLocalStorage?.nombre} ${datosLocalStorage?.apellido}`;
      const direccionEntrega = `${datosLocalStorage?.direccionEntrega}`;
      const direccionRecogida = `${datosLocalStorageformDataRemitente?.direccionRecogida}`;

      console.log("Registrando envío con datos:", {
        numeroGuia,
        paymentId,
        origen: direccionRecogida,
        destino: direccionEntrega,
        destinatario: nombreCompleto,
        usuarioEmail: session?.user?.email,
      });

      const response = await fetch("/api/guardarenvio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroGuia,
          paymentId,
          origen: direccionRecogida,
          destino: direccionEntrega,
          destinatario: nombreCompleto,
          usuarioEmail: session?.user?.email,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("Envío registrado exitosamente:", responseData);
        
        // Guardar datos del envío
        localStorage.setItem("envioDatos", JSON.stringify(responseData));
        localStorage.setItem("envioExitoso", "true");
        
        // Mostrar mensaje de éxito y redirigir
        alert("¡Envío realizado exitosamente! Espere pronta actualización.");
        
        // Redirigir a mis envíos después de un breve delay
        setTimeout(() => {
          window.location.href = "/misenvios";
        }, 2000);
        
      } else {
        console.error("Error al registrar el envío:", responseData);
        alert("Hubo un error al registrar tu envío. Por favor contacta soporte.");
      }
    } catch (error) {
      console.error("Error al registrar el envío:", error);
      alert("Error de conexión al registrar el envío. Inténtalo nuevamente.");
    }
  }, [paymentId, session?.user?.email]);

  useEffect(() => {
    if (status === "approved") {
      manejarEnvioAprobado();
    }
  }, [status]);
  const onError = async (error) => {
    console.log(error);
  };
  console.log(
    "paymentId********************************************",
    paymentId
  );
  const customization = {
    paymentMethods: {
      ticket: "all",
      bankTransfer: "all",
      creditCard: "all",
      debitCard: "all",
      mercadoPago: "all",
    },
  };
  return (
    <InternalProvider context={{ paymentId }}>
      {isLoadingAmount ? (
        <div className="text-center p-10">Cargando información de pago...</div>
      ) : initError ? (
        <div className="text-center p-10 text-red-600 font-semibold">
          {initError}
        </div>
      ) : !initializationConfig ? (
        <div className="text-center p-10 text-red-600 font-semibold">
          Error inesperado al preparar el pago.
        </div>
      ) : (
        <section className={paymentMethods}>
          <Payment
            initialization={initializationConfig}
            customization={customization}
            onSubmit={onSubmit}
            //  onReady={onReady}
            onError={onError}
          />
        </section>
      )}

      <Screen />
    </InternalProvider>
  );
};
export default MercadoPagoComponent;
