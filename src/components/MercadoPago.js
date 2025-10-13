"use client";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import classnames from "classnames";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import Screen from "@/components/BrickStatusScreen";

import InternalProvider from "../app/ContextProvider";
import { useNotification } from "../hooks/useNotification";

import NotificationModal from "./NotificationModal";

import "../styles/mercadopago.css";
//import { guardarEnviosRequest } from "../../api/avu.api";// en mi csao guarar para el historial

const initMPago = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
console.log("initMPago", initMPago);
// const apiServer = process.env.NEXT_PUBLIC_API_SERVER_URL;
initMercadoPago(initMPago, {
  locale: "es-CL",
});

const MercadoPagoComponent = () => {
  const { data: session } = useSession();
  const [paymentId, setpaymentId] = useState(null);
  const [status, setstatus] = useState(null);
  const [isVisiblePayments, setIsVisiblePayments] = useState(true);
  // const [miperfil, setMiperfil] = useState([]);
  // const [perfilId, setPerfilId] = useState(null);
  const perfilIdRef = useRef(null); // Usa un ref para evitar re-renderizados
  const perfilLoaded = useRef(false);

  const userEmail = session?.user?.email; // Extrae el email al inicio del componente

  // 🎨 Modal de notificaciones
  const { modalState, showSuccess, showError, closeModal } = useNotification();
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

        if (!response.ok) {throw new Error("Error al obtener el perfil");}

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

  const generarNumeroGuia = useCallback(() => {
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
  }, []);
  const paymentMethods = classnames("shopping-cart dark", {
    "shopping-cart--hidden": !isVisiblePayments,
  });
  useEffect(() => {
    if (paymentId) {setIsVisiblePayments(false);}
  }, [paymentId]);
  const onSubmit = async ({ selectedPaymentMethod: _selectedPaymentMethod, formData }) => {
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
        .catch(() => {
          reject();
        });
    });
  };
  useEffect(() => {
    console.log("Estado del pago:", status);
  }, [status]);

  // Función que maneja el envío aprobado
  const manejarEnvioAprobado = useCallback(async () => {
    const numeroGuia = generarNumeroGuia();
    
    try {
      const destinatarioString = localStorage.getItem("destinatarioInfo");
      const remitenteString = localStorage.getItem("formDataRemitente");

      if (!destinatarioString || !remitenteString) {
        throw new Error("Faltan datos de destinatario o remitente para registrar el envío.");
      }

      const datosLocalStorage = JSON.parse(destinatarioString);
      const datosLocalStorageformDataRemitente = JSON.parse(remitenteString);
      const cotizacionString = localStorage.getItem("cotizacion");
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
        `${datosLocalStorage?.nombre ?? ""} ${datosLocalStorage?.apellido ?? ""}`.trim(),
        "Destinatario",
        2
      );

      const remitenteNombre = ensureText(
        `${datosLocalStorageformDataRemitente?.nombre ?? ""} ${datosLocalStorageformDataRemitente?.apellido ?? ""}`.trim(),
        "Remitente",
        2
      );

      const destinoDireccion = ensureText(
        datosLocalStorage?.direccionEntrega,
        "Dirección destino pendiente",
        5
      );

      const origenDireccion = ensureText(
        datosLocalStorageformDataRemitente?.direccionRecogida,
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
          Telefono: sanitizeTelefono(datosLocalStorage?.telefono || datosLocalStorage?.celular),
        },
        Remitente: {
          Nombre: remitenteNombre,
          Direccion: origenDireccion,
          Telefono: sanitizeTelefono(datosLocalStorageformDataRemitente?.telefono || datosLocalStorageformDataRemitente?.celular),
        },
        Peso: peso,
        Dimensiones: dimensiones,
        ValorDeclarado: valorDeclarado,
        usuarioEmail: session?.user?.email ?? null,
        metodoPago: "MERCADO_PAGO",
        pagado: true,
        montoTotal,
        paymentId: paymentId ?? `MP-${Date.now()}`,
      };

      console.log("Registrando envío con datos:", envioData);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envioData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("Envío registrado exitosamente:", responseData);

        localStorage.setItem("envioDatos", JSON.stringify(responseData));
        localStorage.setItem("envioExitoso", "true");

        showSuccess('¡Pago Exitoso! 🎉', '¡Envío realizado exitosamente! Serás redirigido a Mis Envíos.');

        setTimeout(() => {
          window.location.href = "/misenvios";
        }, 2000);
      } else {
        console.error("Error al registrar el envío:", response.status, responseData);
        const errorMessage = responseData?.message || responseData?.error || 'Hubo un error al registrar tu envío. Por favor contacta soporte.';
        showError('Error al Registrar', errorMessage);
      }
    } catch (error) {
      console.error("Error al registrar el envío:", error);
      showError('Error de Conexión', 'Error de conexión al registrar el envío. Inténtalo nuevamente.');
    }
  }, [generarNumeroGuia, paymentId, session?.user?.email, showSuccess, showError]);

  useEffect(() => {
    if (status === "approved") {
      void manejarEnvioAprobado();
    }
  }, [manejarEnvioAprobado, status]);
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

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
      />
    </InternalProvider>
  );
};
export default MercadoPagoComponent;
