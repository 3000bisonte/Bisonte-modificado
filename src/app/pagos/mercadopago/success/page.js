"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function MercadoPagoSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const crearEnvio = async () => {
      console.log("✅ [MercadoPago Success] Usuario llegó desde pago exitoso");
      
      // 🛡️ PROTECCIÓN 1: Verificar si el envío ya fue registrado
      const envioYaRegistrado = localStorage.getItem("envioRegistrado");
      if (envioYaRegistrado === "true") {
        console.log("⚠️ Envío ya registrado previamente. Redirigiendo a Mis Envíos...");
        localStorage.setItem("envioExitoso", "true");
        setIsProcessing(false);
        setTimeout(() => {
          router.replace("/misenvios");
        }, 1000);
        return;
      }

      // Capturar parámetros de MercadoPago
      const paymentId = searchParams.get("payment_id");
      const status = searchParams.get("status");
      const externalReference = searchParams.get("external_reference");
      
      console.log("💳 Parámetros de pago:", { paymentId, status, externalReference });

      // ✅ Si viene de PSE (redirect externo), continuar con el proceso
      // El sessionStorage se puede perder en redirects entre dominios
      const origenPago = sessionStorage.getItem("origenPago");
      console.log("🔍 Origen del pago:", origenPago || "No especificado (probablemente PSE)");
      
      // Si es payment_brick Y no hay paymentId en URL, significa que ya se procesó
      if (origenPago === "payment_brick" && !paymentId) {
        console.log("💳 Pago de Payment Brick ya manejado por MercadoPago.js. Redirigiendo...");
        localStorage.setItem("envioExitoso", "true");
        setIsProcessing(false);
        setTimeout(() => {
          router.replace("/misenvios");
        }, 1000);
        return;
      }

      // 🛡️ PROTECCIÓN 3: Verificar paymentId duplicado
      if (paymentId) {
        const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
        try {
          const ordenes = JSON.parse(ordenesExistentes);
          if (ordenes.includes(paymentId)) {
            console.log("⚠️ Orden con este paymentId ya existe:", paymentId);
            localStorage.setItem("envioExitoso", "true");
            setIsProcessing(false);
            setTimeout(() => {
              router.replace("/misenvios");
            }, 1000);
            return;
          }
        } catch (e) {
          console.warn("⚠️ Error parseando ordenesCreadas, continuando:", e);
        }
      }

      try {
        // Leer datos del localStorage
        const destinatarioString = localStorage.getItem("formDestinatario");
        const remitenteString = localStorage.getItem("formRemitente");
        const cotizacionString = localStorage.getItem("cotizacion");

        if (!destinatarioString || !remitenteString) {
          throw new Error("Faltan datos del formulario. Por favor, intenta crear el envío nuevamente.");
        }

        const destinatario = JSON.parse(destinatarioString);
        const remitente = JSON.parse(remitenteString);
        const cotizacion = cotizacionString ? JSON.parse(cotizacionString) : {};

        // Generar número de guía
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        const numeroGuia = `BIS${timestamp.slice(-6)}${random}`;

        // Preparar datos del envío
        const sanitizeTelefono = (raw) => {
          if (!raw) return "0000000000";
          const digits = String(raw).replace(/\D/g, "");
          return digits.length >= 10 ? digits.slice(0, 10) : digits.padEnd(10, "0");
        };

        const ensureText = (value, fallback, minLength) => {
          const text = typeof value === "string" ? value.trim() : "";
          return text.length >= minLength ? text : fallback;
        };

        const destinatarioNombre = ensureText(
          `${destinatario?.nombre ?? ""} ${destinatario?.apellido ?? ""}`.trim(),
          "Destinatario",
          2
        );

        const remitenteNombre = ensureText(
          `${remitente?.nombre ?? ""} ${remitente?.apellido ?? ""}`.trim(),
          "Remitente",
          2
        );

        const envioData = {
          NumeroGuia: numeroGuia,
          Estado: "RECOLECCION_PENDIENTE",
          Origen: ensureText(remitente?.direccionRecogida, "Dirección origen pendiente", 5),
          Destino: ensureText(destinatario?.direccionEntrega, "Dirección destino pendiente", 5),
          Destinatario: {
            Nombre: destinatarioNombre,
            Direccion: ensureText(destinatario?.direccionEntrega, "Dirección destino pendiente", 5),
            Telefono: sanitizeTelefono(destinatario?.telefono || destinatario?.celular),
          },
          Remitente: {
            Nombre: remitenteNombre,
            Direccion: ensureText(remitente?.direccionRecogida, "Dirección origen pendiente", 5),
            Telefono: sanitizeTelefono(remitente?.telefono || remitente?.celular),
          },
          Peso: Number(cotizacion?.peso) > 0 ? Number(cotizacion.peso) : 1,
          Dimensiones: [cotizacion?.largo, cotizacion?.ancho, cotizacion?.alto]
            .map((v) => {
              const n = Number(v);
              return Number.isFinite(n) && n >= 0 ? n : 0;
            })
            .join("x"),
          ValorDeclarado: Number(cotizacion?.valorDeclarado) >= 0 ? Number(cotizacion.valorDeclarado) : 0,
          usuarioEmail: session?.user?.email ?? null,
          metodoPago: "MERCADO_PAGO",
          pagado: true,
          montoTotal: Number.isFinite(Number(cotizacion?.costoTotal)) ? Number(cotizacion.costoTotal) : 0,
          paymentId: paymentId ?? `MP-${Date.now()}`,
        };

        console.log("📦 Creando envío con datos:", envioData);

        // Crear envío
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(envioData),
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log("✅ Envío registrado exitosamente:", responseData);

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

          setIsProcessing(false);

          // Redirigir a Mis Envíos
          setTimeout(() => {
            console.log("🔄 Redirigiendo a Mis Envíos...");
            router.replace("/misenvios");
          }, 1500);
        } else {
          throw new Error(responseData?.message || responseData?.error || "Error al crear el envío");
        }
      } catch (err) {
        console.error("❌ Error creando envío:", err);
        setError(err.message);
        setIsProcessing(false);

        // 🛡️ Limpiar flags de proceso en caso de error
        sessionStorage.removeItem("pagoEnProceso");

        // Guardar flag de error y redirigir a resumen después de 3s
        localStorage.setItem("pagoRechazado", "true");
        localStorage.setItem("pagoRechazadoMotivo", err.message);

        setTimeout(() => {
          router.replace("/resumen");
        }, 3000);
      }
    };

    // Solo ejecutar si hay sesión
    if (session) {
      crearEnvio();
    }
  }, [router, searchParams, session]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-red-700 mb-3">
            Error al Procesar ❌
          </h1>
          <p className="text-gray-700 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo para intentar nuevamente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center p-8">
        {/* Animación de éxito */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-green-700 mb-3">
          {isProcessing ? "Procesando..." : "¡Pago Exitoso! 🎉"}
        </h1>
        <p className="text-gray-600 mb-2">
          {isProcessing ? "Registrando tu envío" : "Tu envío ha sido registrado"}
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo a tus envíos...
        </p>
        
        {/* Spinner de carga */}
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
        </div>
      </div>
    </div>
  );
}
