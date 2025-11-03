"use client";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import classnames from "classnames";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import Screen from "@/components/BrickStatusScreen";

import InternalProvider from "../app/ContextProvider";
import { useNotification } from "../hooks/useNotification";

import NotificationModal from "./NotificationModal";

import "../styles/mercadopago.css";
//import { guardarEnviosRequest } from "../../api/avu.api";// en mi csao guarar para el historial

const initMPago = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
if (process.env.NODE_ENV !== "production") {
  console.log("initMPago", initMPago);
}
// const apiServer = process.env.NEXT_PUBLIC_API_SERVER_URL;
if (initMPago) {
  initMercadoPago(initMPago, {
    // Usar configuración para Colombia
    locale: "es-CO",
  });
} else {
  console.error(
    "[MercadoPago] Falta la clave pública NEXT_PUBLIC_INIT_MERCADOPAGO. El brick no podrá inicializarse."
  );
}

const MercadoPagoComponent = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [paymentId, setpaymentId] = useState(null);
  const [status, setstatus] = useState(null);
  const [isVisiblePayments, setIsVisiblePayments] = useState(true);
  const [isPSEPayment, setIsPSEPayment] = useState(false); // 🏦 Rastrear pagos PSE
  // const [miperfil, setMiperfil] = useState([]);
  // const [perfilId, setPerfilId] = useState(null);
  const perfilIdRef = useRef(null); // Usa un ref para evitar re-renderizados
  const perfilLoaded = useRef(false);

  const userEmail = session?.user?.email; // Extrae el email al inicio del componente

  // 🔍 Log de diagnóstico al montar el componente
  useEffect(() => {
    console.log("🚀 MercadoPago Component montado");
    console.log("📧 Email de usuario:", userEmail || "No disponible");
    console.log("🔑 MercadoPago inicializado:", !!initMPago);
    console.log("🌍 Entorno:", process.env.NODE_ENV);
    console.log("🌐 Conexión:", navigator.onLine ? "Online" : "Offline");
  }, [userEmail]);

  // 🧹 Limpiar flags antiguos cuando el usuario vuelve a /pago
  useEffect(() => {
    const limpiarFlagsAnteriores = () => {
      const timestampPago = sessionStorage.getItem("timestampPago");
      if (timestampPago) {
        const tiempoTranscurrido = Date.now() - parseInt(timestampPago);
        const CINCO_MINUTOS = 5 * 60 * 1000;
        
        if (tiempoTranscurrido > CINCO_MINUTOS) {
          console.log("🧹 Limpiando flags de pago anterior (>5 min)");
          localStorage.removeItem("envioRegistrado");
          localStorage.removeItem("pagoPendiente");
          localStorage.removeItem("pagoRechazado");
          localStorage.removeItem("envioExitoso");
          sessionStorage.removeItem("pagoEnProceso");
          sessionStorage.removeItem("origenPago");
          sessionStorage.removeItem("timestampPago");
        }
      }
    };
    
    limpiarFlagsAnteriores();
  }, []);

  // 🏦 Detectar retorno de PSE al cargar el componente
  useEffect(() => {
    const currentUrl = window.location.href;
    const isReturningFromPSE = currentUrl.includes('payment_id') || 
                               currentUrl.includes('external_reference') ||
                               currentUrl.includes('status=approved') ||
                               currentUrl.includes('status=pending');
    
    if (isReturningFromPSE) {
      console.log("🏦 Detectado retorno de PSE - Activando modo PSE");
      setIsPSEPayment(true);
    }
  }, []);

  // �🎨 Modal de notificaciones
  const { modalState, showSuccess, showError, closeModal } = useNotification();
  
  // Función showWarning que faltaba
  const showWarning = (title, message) => {
    showError(title, message); // Usar showError como fallback
  };
  const [initializationConfig, setInitializationConfig] = useState(null); // Para guardar { preferenceId: XXX }
  const [paymentAmount, setPaymentAmount] = useState(null); // Para mostrar el monto
  const [isLoadingAmount, setIsLoadingAmount] = useState(true); // Para mostrar "Cargando..."
  const [initError, setInitError] = useState(null);
  const preferenceCreated = useRef(false); // ✅ Evitar múltiples llamadas
  const amountLoaded = useRef(false); // ✅ Evitar recalcular el monto

  // ✅ Nueva función para crear preferencia de pago
  const createPaymentPreference = async (amount, email) => {
    try {
      console.log("🔄 Creando preferencia de pago en MercadoPago...");
      console.log("  - Monto:", amount);
      console.log("  - Email:", email);

      // ⏰ Timeout para evitar espera infinita
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

      const response = await fetch("/api/mercadopago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: "Envío Bisonte Logística",
          payer: {
            email: email || "guest@bisonteapp.com",
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📡 Respuesta recibida del servidor:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Error del servidor creando preferencia:", error);
        throw new Error(error.error || error.details || "Error al crear preferencia de pago");
      }

      const data = await response.json();
      console.log("✅ Preferencia creada exitosamente:", data.preference_id);
      console.log("📦 Datos completos:", data);
      
      return data.preference_id;
    } catch (error) {
      console.error("❌ Error en createPaymentPreference:", error);
      
      if (error.name === 'AbortError') {
        throw new Error("La conexión está muy lenta. El servidor tardó más de 15 segundos en responder. Por favor intenta nuevamente.");
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error("No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.");
      }
      
      throw error;
    }
  };

  useEffect(() => {
    const initializePayment = async () => {
      // ✅ Evitar múltiples ejecuciones
      if (preferenceCreated.current) {
        console.log("⏭️ Preferencia ya creada, omitiendo...");
        return;
      }

      // ✅ Verificar que tenemos email antes de proceder
      if (!userEmail) {
        console.log("⏳ Esperando email de usuario...");
        return;
      }

      setIsLoadingAmount(true);
      setInitError(null);
      setInitializationConfig(null);

      const candidateKeys = [
        "cotizacion",
        "formCotizador",
        "cotizador",
      ];

      const extractNumericAmount = (value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
      };

      const persistNormalizedCotizacion = (data, amount, sourceKey) => {
        if (!data || typeof data !== "object") {
          return;
        }

        try {
          let merged = data;

          if (sourceKey !== "cotizacion") {
            const existingRaw = localStorage.getItem("cotizacion");
            if (existingRaw) {
              try {
                const existing = JSON.parse(existingRaw);
                merged = {
                  ...existing,
                  ...data,
                };
              } catch (mergeError) {
              console.warn(
                "[MercadoPago] No se pudo combinar la cotización existente con la de respaldo:",
                mergeError
              );
            }
          }
        }

        const normalized = {
          ...merged,
          costoTotal: amount,
        };
        localStorage.setItem("cotizacion", JSON.stringify(normalized));
      } catch (persistError) {
        console.error("[MercadoPago] Error normalizando 'cotizacion':", persistError);
      }
    };

    const resolveAmount = () => {
      for (const key of candidateKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          const possibleAmounts = [
            parsed?.costoTotal,
            parsed?.total,
            parsed?.amount,
            parsed?.montoTotal,
            parsed?.precio,
          ];

          for (const maybeAmount of possibleAmounts) {
            const numeric = extractNumericAmount(maybeAmount);
            if (numeric !== null) {
              persistNormalizedCotizacion(parsed, numeric, key);
              return numeric;
            }
          }
        } catch (parseError) {
          console.error(`[MercadoPago] Error al parsear '${key}' desde localStorage:`, parseError);
        }
      }

      return null;
    };

    try {
      if (typeof window === "undefined") {
        setInitError("Error: Entorno no compatible (localStorage no disponible).");
        return;
      }

      const amount = resolveAmount();

      if (amount !== null) {
        console.log(
          "💰 Monto cargado para inicializar Mercado Pago:",
          amount
        );
        
        // Guardar el monto para mostrarlo en la UI
        setPaymentAmount(amount);
        amountLoaded.current = true;
        
        // ✅ Crear preferencia de pago en el backend
        try {
          console.log("🔍 Creando preferencia de pago...");
          const preferenceId = await createPaymentPreference(amount, userEmail);
          
          if (!preferenceId) {
            throw new Error("No se recibió un ID de preferencia válido");
          }
          
          console.log("✅ Configurando Payment Brick con preferenceId:", preferenceId);
          setInitializationConfig({ 
            preferenceId,
            amount: amount, // ✅ El Payment Brick necesita el amount también
          });
          
          // ✅ Marcar como creada para evitar duplicados
          preferenceCreated.current = true;
          
        } catch (prefError) {
          console.error("❌ Error creando preferencia:", prefError);
          
          const errorMessage = prefError.message || "Error desconocido";
          console.error("📋 Detalles del error:", {
            nombre: prefError.name,
            mensaje: errorMessage,
            stack: prefError.stack
          });
          
          setInitError(
            `No se pudo inicializar el pago: ${errorMessage}. Por favor verifica tu conexión a internet e intenta nuevamente.`
          );
        }
      } else {
        console.error("No se encontraron datos válidos de cotización para el pago.");
        setInitError(
          "No se encontraron los datos de la cotización para el pago."
        );
      }
    } finally {
      setIsLoadingAmount(false); // Indicar que terminamos de intentar cargar
    }
    };

    initializePayment();
  }, [userEmail]);
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
        const dataArray = Array.isArray(data) ? data : [];
        const perfil = dataArray.find((perf) => perf.correo === userEmail);

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
    console.log("💳 Procesando pago con Payment Brick...");
    console.log("📋 Datos del formulario (completos):", JSON.stringify(formData, null, 2));
    
    // 🛡️ PROTECCIÓN: Marcar que un pago está en proceso
    sessionStorage.setItem("pagoEnProceso", "true");
    sessionStorage.setItem("timestampPago", Date.now().toString());
    
    // 🏦 Detectar si es pago PSE y resetear estado previo
    const isPSE = formData.payment_method_id === 'pse';
    const isEfecty = formData.payment_method_id === 'efecty';
    setIsPSEPayment(isPSE);
    
    // 🏦 Marcar el origen del pago según el método
    if (isPSE || isEfecty) {
      console.log("🏦 Pago externo detectado - success/page.js manejará la creación de orden");
      sessionStorage.setItem("origenPago", "redirect_externo");
    } else {
      console.log("💳 Pago Payment Brick - MercadoPago.js manejará la creación de orden");
      sessionStorage.setItem("origenPago", "payment_brick");
    }
    
    console.log(`🎯 Método de pago detectado: ${formData.payment_method_id} ${isPSE ? '(PSE)' : isEfecty ? '(Efecty)' : '(Otro método)'}`);
    
    console.log("📋 Resumen:", {
      amount: formData.transaction_amount,
      method: formData.payment_method_id,
      installments: formData.installments,
      email: formData.payer?.email,
      isPSE: isPSE,
      isEfecty: isEfecty,
      origenPago: sessionStorage.getItem("origenPago"),
      hasFinancialInstitution: !!formData.transaction_details?.financial_institution || !!formData.financial_institution,
    });

    return new Promise((resolve, reject) => {
      fetch("/api/mercadopago/process-payment", {  // ✅ NUEVO ENDPOINT
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("📥 Respuesta del servidor:", result);

          if (!result.success) {
            console.error("❌ Error en el pago:", result);
            
            // Construir mensaje de error más descriptivo
            let errorTitle = 'Error al Procesar Pago';
            let errorMessage = result.error || 'Hubo un problema al procesar tu pago.';
            let errorDetails = '';

            // Si es un error de configuración
            if (result.httpStatus === 401 || result.details?.includes('Access Token')) {
              errorTitle = 'Error de Configuración';
              errorDetails = 'El sistema de pagos no está configurado correctamente. Por favor, contacta al administrador.';
            } 
            // Si es un error de datos inválidos
            else if (result.httpStatus === 400) {
              errorTitle = 'Datos Inválidos';
              errorDetails = 'Por favor, verifica los datos de tu tarjeta e inténtalo nuevamente.';
            }
            // Si es un error del servidor de MP
            else if (result.httpStatus >= 500) {
              errorTitle = 'Servicio No Disponible';
              errorDetails = 'Mercado Pago está experimentando problemas. Intenta nuevamente en unos minutos.';
            }

            showError(
              errorTitle,
              `${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}`
            );
            reject(result.error);
            return;
          }

          const paymentId = result.id || result.payment?.id;
          const paymentStatus = result.status || result.payment?.status;
          const statusDetail = result.status_detail || result.payment?.status_detail;

          console.log(`✅ Pago procesado - ID: ${paymentId}, Estado: ${paymentStatus}`);

          setpaymentId(paymentId);
          setstatus(paymentStatus);

          // ✅ CORREGIDO: Manejar diferentes estados de pago correctamente
          if (paymentStatus === "approved") {
            console.log("✅ Pago APROBADO - Registrando envío y redirigiendo...");
            resolve();
          } else if (paymentStatus === "in_process" || paymentStatus === "pending") {
            console.log("⏳ Pago PENDIENTE - Estado:", statusDetail);
            
            // ✅ Guardar información del pago pendiente
            localStorage.setItem("pagoPendiente", "true");
            localStorage.setItem("pagoPendienteMotivo", statusDetail || 'Tu pago está siendo procesado');
            localStorage.setItem("pagoPendienteId", paymentId || '');
            
            // ✅ Mostrar mensaje informativo
            showWarning(
              'Pago Pendiente por Procesar ⏳',
              'Tu pago está en proceso de confirmación. Te mantendremos informado sobre el estado. Serás redirigido al resumen.'
            );
            
            // ✅ Redirigir al resumen para que vea el estado
            setTimeout(() => {
              console.log("🔄 Redirigiendo al resumen (pago pendiente)...");
              router.push("/resumen");
            }, 3000);
            
            reject('pending_payment');
          } else {
            console.error("❌ Pago rechazado - Estado:", paymentStatus, statusDetail);
            
            // Guardar información del pago rechazado para mostrar en resumen
            localStorage.setItem("pagoRechazado", "true");
            localStorage.setItem("pagoRechazadoMotivo", statusDetail || 'Pago rechazado');
            
            showError(
              'Pago Rechazado',
              `Tu pago fue rechazado. ${statusDetail || 'Por favor, verifica los datos e inténtalo nuevamente.'}`
            );
            
            // Redirigir al resumen después de mostrar el error
            setTimeout(() => {
              console.log("🔄 Redirigiendo al resumen (pago rechazado)...");
              router.push("/resumen");
            }, 3000);
            
            reject(statusDetail || 'Pago rechazado');
          }
        })
        .catch((error) => {
          console.error("❌ Error de red al procesar pago:", error);
          
          // 🚀 Para PSE, Efecty y otros métodos de pago externos que redirigen,
          // el error puede ser esperado (redirección en proceso)
          if (isPSE || formData.payment_method_id === 'efecty') {
            console.log("🏦 Flujo de pago externo iniciado - No mostrar error de conexión");
            return; // No rechazar para métodos externos
          }
          
          // Para otros errores de red, mostrar mensaje y redirigir al resumen
          console.error("❌ Error de conexión no esperado:", error);
          
          localStorage.setItem("pagoRechazado", "true");
          localStorage.setItem("pagoRechazadoMotivo", "Error de conexión al procesar el pago");
          
          showError(
            'Error de Conexión',
            'Hubo un problema de conexión al procesar tu pago. Por favor, verifica tu internet e inténtalo nuevamente.'
          );
          
          setTimeout(() => {
            console.log("🔄 Redirigiendo al resumen (error de conexión)...");
            router.push("/resumen");
          }, 3000);
          
          reject(error);
        });
    });
  };
  useEffect(() => {
    console.log("Estado del pago:", status);
  }, [status]);

  // Función que maneja el envío aprobado
  const manejarEnvioAprobado = useCallback(async () => {
    // 🛡️ PROTECCIÓN 1: Verificar si el envío ya fue registrado
    const envioYaRegistrado = localStorage.getItem("envioRegistrado");
    if (envioYaRegistrado === "true") {
      console.log("⚠️ Envío ya registrado previamente. Evitando duplicación.");
      return;
    }

    // 🛡️ PROTECCIÓN 2: Solo ejecutar si el pago se inició desde Payment Brick
    const origenPago = sessionStorage.getItem("origenPago");
    if (origenPago === "redirect_externo") {
      console.log("🏦 Pago externo - success/page.js manejará la creación. Saltando ejecución.");
      return;
    }

    // 🛡️ PROTECCIÓN 3: Verificar que paymentId no esté duplicado
    if (paymentId) {
      const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
      try {
        const ordenes = JSON.parse(ordenesExistentes);
        if (ordenes.includes(paymentId)) {
          console.log("⚠️ Orden con este paymentId ya existe:", paymentId);
          return;
        }
      } catch (e) {
        console.warn("⚠️ Error parseando ordenesCreadas, continuando:", e);
      }
    }

    const numeroGuia = generarNumeroGuia();
    
    try {
      // ✅ CORREGIDO: Usar las claves correctas de localStorage
      const destinatarioString = localStorage.getItem("formDestinatario");
      const remitenteString = localStorage.getItem("formRemitente");

      if (!destinatarioString || !remitenteString) {
        console.error("❌ Datos faltantes en localStorage:", {
          destinatario: destinatarioString ? "✓" : "✗",
          remitente: remitenteString ? "✓" : "✗",
          todasLasClaves: Object.keys(localStorage)
        });
        throw new Error("Faltan datos de destinatario o remitente para registrar el envío.");
      }

      const datosLocalStorage = JSON.parse(destinatarioString);
      const datosLocalStorageformDataRemitente = JSON.parse(remitenteString);
      const cotizacionString = localStorage.getItem("cotizacion");
      const cotizacionLocal = cotizacionString ? JSON.parse(cotizacionString) : {};
      
      console.log("📦 Datos recuperados de localStorage:", {
        destinatario: datosLocalStorage?.nombre,
        remitente: datosLocalStorageformDataRemitente?.nombre,
        cotizacion: cotizacionLocal?.costoTotal
      });

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

      console.log("📦 Datos completos que se enviarán a /api/orders:", envioData);
      console.log("🔍 Validación de tipos:", {
        "Peso (tipo)": typeof peso,
        "Peso (valor)": peso,
        "ValorDeclarado (tipo)": typeof valorDeclarado,
        "ValorDeclarado (valor)": valorDeclarado,
        "Destinatario.Telefono (tipo)": typeof envioData.Destinatario.Telefono,
        "Destinatario.Telefono (valor)": envioData.Destinatario.Telefono,
        "Remitente.Telefono (tipo)": typeof envioData.Remitente.Telefono,
        "Remitente.Telefono (valor)": envioData.Remitente.Telefono,
      });

      console.log("🚀 Enviando POST a /api/orders...");
      
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envioData),
      });

      console.log("📡 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const responseData = await response.json();
      
      console.log("📄 Datos de respuesta:", responseData);

      if (response.ok) {
        console.log("✅ Envío registrado exitosamente:", responseData);
        console.log("📦 Detalles del envío:", {
          id: responseData.id,
          NumeroGuia: responseData.NumeroGuia,
          usuarioId: responseData.usuarioId,
          Estado: responseData.Estado,
          PaymentId: responseData.PaymentId,
        });

        // 🛡️ MARCAR ENVÍO COMO REGISTRADO para evitar duplicados
        localStorage.setItem("envioRegistrado", "true");

        // 🛡️ REGISTRAR paymentId para evitar duplicados
        if (paymentId) {
          const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
          try {
            const ordenes = JSON.parse(ordenesExistentes);
            ordenes.push(paymentId);
            localStorage.setItem("ordenesCreadas", JSON.stringify(ordenes));
            console.log("✅ PaymentId registrado:", paymentId);
          } catch (e) {
            console.warn("⚠️ Error guardando paymentId:", e);
          }
        }

        // Guardar información del envío
        localStorage.setItem("envioDatos", JSON.stringify({
          ...responseData,
          numeroGuia,
          tipo: "mercadopago",
          metodoPago: "MERCADO_PAGO",
          paymentId: paymentId,
        }));
        localStorage.setItem("envioExitoso", "true");
        localStorage.setItem("ultimoEnvioId", responseData.id?.toString() || "");

        // Limpiar datos del formulario
        localStorage.removeItem("formCotizador");
        localStorage.removeItem("cotizacion");
        localStorage.removeItem("formRemitente");
        localStorage.removeItem("formDestinatario");

        // 🛡️ Limpiar flags de proceso
        sessionStorage.removeItem("pagoEnProceso");
        sessionStorage.removeItem("origenPago");
        sessionStorage.removeItem("timestampPago");

        showSuccess('¡Pago Exitoso! 🎉', '¡Envío realizado exitosamente! Redirigiendo a Mis Envíos...');

        // ✅ Redirigir a Mis Envíos con router.replace (no permite volver atrás)
        setTimeout(() => {
          console.log("🔄 Redirigiendo a Mis Envíos...");
          router.replace("/misenvios"); // ✅ CORRECCIÓN: replace en lugar de push
        }, 2000); // Reducido a 2 segundos para mejor UX
      } else {
        console.error("❌ ERROR al registrar el envío:", {
          status: response.status,
          statusText: response.statusText,
          responseData: responseData,
        });
        
        // Si es error de validación (400), mostrar detalles
        if (response.status === 400 && responseData?.errors) {
          console.error("🔴 ERRORES DE VALIDACIÓN:", responseData.errors);
          console.error("📋 Campos que fallaron:", Object.keys(responseData.errors));
        }
        
        const errorMessage = responseData?.message || responseData?.error || 'Hubo un error al registrar tu envío. Por favor contacta soporte.';
        const errorDetails = responseData?.details || '';
        
        console.error("💬 Mensaje de error para el usuario:", errorMessage);
        if (errorDetails) {
          console.error("📝 Detalles adicionales:", errorDetails);
        }
        
        showError('Error al Registrar', `${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}`);
      }
    } catch (error) {
      console.error("❌ Error al registrar el envío:", error);
      
      // �️ Limpiar flags de proceso en caso de error
      sessionStorage.removeItem("pagoEnProceso");
      
      // �🔍 Logging detallado del error
      console.error("📋 Detalles completos del error:", {
        message: error?.message || 'Sin mensaje',
        name: error?.name || 'Sin nombre',
        stack: error?.stack || 'Sin stack',
        errorObject: error,
      });
      
      // Intentar extraer más información si es un error de fetch
      if (error?.response) {
        console.error("📡 Respuesta HTTP del error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      // 🚀 Para flujos de PSE/Efecty, reintentar sin mostrar error al usuario
      console.log("🏦 Reintentando automáticamente sin mostrar error...");
      setTimeout(() => {
        void manejarEnvioAprobado();
      }, 3000);
    }
  }, [generarNumeroGuia, paymentId, session?.user?.email, showSuccess, showError]);

  useEffect(() => {
    console.log("🔍 Estado del pago actualizado:", status);
    
    // 🛡️ PROTECCIÓN 1: No procesar si el envío ya fue registrado
    const envioYaRegistrado = localStorage.getItem("envioRegistrado");
    if (envioYaRegistrado === "true") {
      console.log("⚠️ Envío ya registrado. Saltando procesamiento de pago.");
      return;
    }

    // 🛡️ PROTECCIÓN 2: Solo ejecutar para Payment Brick (no para redirects externos)
    const origenPago = sessionStorage.getItem("origenPago");
    if (origenPago === "redirect_externo") {
      console.log("🏦 Pago externo - success/page.js lo manejará. Saltando ejecución.");
      return;
    }
    
    // ✅ SOLO registrar envío cuando el pago es APROBADO
    if (status === "approved") {
      console.log(`✅ Pago APROBADO - Registrando envío con estado: ${status}`);
      void manejarEnvioAprobado();
    } else if (status === "in_process" || status === "pending") {
      console.warn(`⏳ Pago ${status} - NO se registrará el envío aún. Esperando confirmación.`);
      
      // Guardar información del pago pendiente
      localStorage.setItem("pagoPendiente", "true");
      localStorage.setItem("pagoPendienteMotivo", `Pago ${status === 'pending' ? 'pendiente' : 'en proceso'}`);
      
      // No hacer nada más aquí, el webhook lo manejará cuando sea aprobado
    } else if (status === "rejected" || status === "cancelled") {
      console.error(`❌ Pago ${status} - No se registrará el envío`);
      
      // Guardar información del pago rechazado
      localStorage.setItem("pagoRechazado", "true");
      localStorage.setItem("pagoRechazadoMotivo", status === 'rejected' ? 'Pago rechazado' : 'Pago cancelado');
      
      showError(
        'Pago No Exitoso',
        `Tu pago fue ${status === 'rejected' ? 'rechazado' : 'cancelado'}. Serás redirigido al resumen para intentar nuevamente.`
      );
      
      // Redirigir al resumen después de 3 segundos
      setTimeout(() => {
        console.log("🔄 Redirigiendo al resumen (pago no exitoso)...");
        router.push("/resumen");
      }, 3000);
    }
  }, [manejarEnvioAprobado, status, showError, router]);
  const onError = async (error) => {
    console.error("❌ Error en Payment Brick:", error);
    
    // 🚀 Para PSE, Efecty y pagos externos no mostrar error
    // El Payment Brick los redirige automáticamente
    console.log("🏦 Error capturado - Puede ser parte del flujo de redirección normal");
  };
  console.log(
    "paymentId********************************************",
    paymentId
  );
  const customization = {
    // Habilitar explícitamente métodos soportados para CO
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      ticket: "all", // efectivo
      bankTransfer: "all", // incluye PSE
      mercadoPago: "all",
      minInstallments: 1,
      maxInstallments: 12,
    },
    visual: {
      style: { theme: "default" },
      hidePaymentButton: false,
    },
  };

  // ✅ Log detallado antes de renderizar
  useEffect(() => {
    if (initializationConfig) {
      console.log("🔍 [DEBUG] Payment Brick va a renderizar con:");
      console.log("  - Preference ID:", initializationConfig.preferenceId);
      console.log("  - Amount:", initializationConfig.amount); // ✅ Mostrar amount
      // Evitar acceder a estructuras inexistentes; mostrar configuración de métodos habilitados
      console.log("  - Métodos habilitados:", customization.paymentMethods);
      console.log(
        "  - Cuotas:",
        customization.paymentMethods?.minInstallments,
        "-",
        customization.paymentMethods?.maxInstallments
      );
    }
  }, [initializationConfig]);
  return (
    <InternalProvider context={{ paymentId }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver al resumen</span>
          </button>

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Pago Seguro</h1>
                  <p className="text-sm text-gray-500">Protegido por Mercado Pago</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Conexión Segura SSL</span>
              </div>
            </div>

            {initializationConfig && paymentAmount && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
                    <p className="text-3xl font-bold text-gray-800">
                      ${Number(paymentAmount).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Método de pago</p>
                    <p className="text-sm font-semibold text-gray-700">Mercado Pago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Content */}
          {isLoadingAmount ? (
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#41e0b3] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Cargando información de pago</h3>
                <p className="text-sm text-gray-500">Por favor espera un momento...</p>
              </div>
            </div>
          ) : initError ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Error al cargar el pago</h3>
                <p className="text-red-600 font-medium mb-4">{initError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#41e0b3] hover:bg-[#2bbd8c] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : !initializationConfig ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Error inesperado</h3>
                <p className="text-gray-600 mb-4">No se pudo preparar el pago. Por favor intenta nuevamente.</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
                >
                  Volver atrás
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Compra protegida</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Datos encriptados</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Pago verificado</span>
                </div>
              </div>

              {/* Payment Form */}
              <section className={`mercadopago-payment-section ${paymentMethods}`}>
                <Payment
                  key={initializationConfig?.preferenceId || 'loading'}
                  initialization={initializationConfig}
                  customization={customization}
                  onSubmit={onSubmit}
                  onError={onError}
                  onReady={() => {
                    console.log("🎯 Payment Brick inicializado correctamente");
                    console.log("📋 Configuración actual:", {
                      preferenceId: initializationConfig.preferenceId,
                      amount: paymentAmount,
                      customization: customization
                    });
                  }}
                />
              </section>

              {/* Footer Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p>
                    <strong>Información importante:</strong> Tu pago será procesado de forma segura por Mercado Pago. 
                    Una vez confirmado el pago, recibirás un correo con los detalles de tu envío y el número de guía.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Info */}
          <div className="mt-6 bg-white rounded-xl shadow p-4">
            <p className="text-center text-sm text-gray-600 mb-3">Aceptamos todos los medios de pago</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">💳 Tarjetas de crédito</span>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">💵 Tarjetas de débito</span>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">🏦 Transferencia bancaria</span>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">📱 Mercado Pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
