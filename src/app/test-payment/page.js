"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestPaymentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testPaymentFlow = async () => {
    setLoading(true);
    setLogs([]);
    addLog("🧪 Iniciando prueba de flujo de pago...", "info");

    try {
      // 1. Obtener datos del localStorage
      addLog("📦 Paso 1: Obteniendo datos del localStorage...", "info");
      
      const destinatarioString = localStorage.getItem("formDestinatario");
      const remitenteString = localStorage.getItem("formRemitente");
      const cotizacionString = localStorage.getItem("cotizacion");

      if (!destinatarioString || !remitenteString) {
        addLog("❌ ERROR: Faltan datos de destinatario o remitente", "error");
        addLog("💡 Ve a Cotizador y completa una cotización primero", "warning");
        return;
      }

      const destinatario = JSON.parse(destinatarioString);
      const remitente = JSON.parse(remitenteString);
      const cotizacion = cotizacionString ? JSON.parse(cotizacionString) : {};

      addLog(`✅ Destinatario: ${destinatario.nombre || "N/A"}`, "success");
      addLog(`✅ Remitente: ${remitente.nombre || "N/A"}`, "success");
      addLog(`✅ Cotización: $${cotizacion.costoTotal || 0}`, "success");

      // 2. Simular pago
      addLog("💳 Paso 2: Simulando pago con MercadoPago...", "info");
      
      const paymentResponse = await fetch("/api/test-payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        addLog(`❌ Error simulando pago: ${paymentData.error}`, "error");
        return;
      }

      addLog(`✅ Pago simulado exitoso: ${paymentData.paymentId}`, "success");

      // 3. Generar número de guía
      const numeroGuia = `BIS${Date.now()}${Math.floor(Math.random() * 10000)}`;
      addLog(`📋 Número de guía generado: ${numeroGuia}`, "info");

      // 4. Preparar datos del envío
      addLog("📦 Paso 3: Preparando datos del envío...", "info");

      const sanitizeTelefono = (raw) => {
        if (!raw) return "0000000000";
        const digits = String(raw).replace(/\\D/g, "");
        if (!digits) return "0000000000";
        return digits.length >= 10 ? digits.slice(0, 10) : digits.padEnd(10, "0");
      };

      const ensureText = (value, fallback, minLength) => {
        const text = typeof value === "string" ? value.trim() : "";
        if (text.length >= minLength) return text;
        return fallback;
      };

      const peso = Number(cotizacion?.peso) > 0 ? Number(cotizacion.peso) : 1;
      const valorDeclarado = Number(cotizacion?.valorDeclarado) >= 0 ? Number(cotizacion.valorDeclarado) : 0;

      const envioData = {
        NumeroGuia: numeroGuia,
        Estado: "RECOLECCION_PENDIENTE",
        Origen: ensureText(remitente?.direccionRecogida, "Dirección origen pendiente", 5),
        Destino: ensureText(destinatario?.direccionEntrega, "Dirección destino pendiente", 5),
        Destinatario: {
          Nombre: ensureText(`${destinatario?.nombre || ""} ${destinatario?.apellido || ""}`.trim(), "Destinatario", 2),
          Direccion: ensureText(destinatario?.direccionEntrega, "Dirección destino pendiente", 5),
          Telefono: sanitizeTelefono(destinatario?.telefono || destinatario?.celular),
        },
        Remitente: {
          Nombre: ensureText(`${remitente?.nombre || ""} ${remitente?.apellido || ""}`.trim(), "Remitente", 2),
          Direccion: ensureText(remitente?.direccionRecogida, "Dirección origen pendiente", 5),
          Telefono: sanitizeTelefono(remitente?.telefono || remitente?.celular),
        },
        Peso: peso,
        Dimensiones: [cotizacion?.largo, cotizacion?.ancho, cotizacion?.alto]
          .map((v) => {
            const n = Number(v);
            return Number.isFinite(n) && n >= 0 ? n : 0;
          })
          .join("x"),
        ValorDeclarado: valorDeclarado,
        usuarioEmail: session?.user?.email ?? null,
        metodoPago: "MERCADO_PAGO_TEST",
        pagado: true,
        montoTotal: Number(cotizacion?.costoTotal) || 0,
        paymentId: paymentData.paymentId,
      };

      addLog("🔍 Validación de tipos:", "info");
      addLog(`  - Peso: ${typeof peso} = ${peso}`, "info");
      addLog(`  - ValorDeclarado: ${typeof valorDeclarado} = ${valorDeclarado}`, "info");
      addLog(`  - Destinatario.Telefono: ${typeof envioData.Destinatario.Telefono} = ${envioData.Destinatario.Telefono}`, "info");
      addLog(`  - Remitente.Telefono: ${typeof envioData.Remitente.Telefono} = ${envioData.Remitente.Telefono}`, "info");

      // 5. Enviar a la API
      addLog("🚀 Paso 4: Enviando a /api/orders...", "info");
      addLog(JSON.stringify(envioData, null, 2), "info");

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envioData),
      });

      const orderData = await orderResponse.json();

      addLog(`📡 Respuesta: ${orderResponse.status} ${orderResponse.statusText}`, 
        orderResponse.ok ? "success" : "error");

      if (orderResponse.ok) {
        addLog("✅ ¡ENVÍO CREADO EXITOSAMENTE!", "success");
        addLog(`📦 ID: ${orderData.id}`, "success");
        addLog(`📋 Número de Guía: ${orderData.NumeroGuia}`, "success");
        addLog(`👤 Usuario ID: ${orderData.usuarioId}`, "success");

        // Guardar flags
        localStorage.setItem("envioRegistrado", "true");
        localStorage.setItem("envioExitoso", "true");
        localStorage.setItem("envioDatos", JSON.stringify(orderData));

        addLog("🔄 Redirigiendo a Mis Envíos en 3 segundos...", "info");
        
        setTimeout(() => {
          router.push("/misenvios");
        }, 3000);
      } else {
        addLog(`❌ ERROR al crear envío: ${orderData.message}`, "error");
        
        if (orderData.errors) {
          addLog("🔴 ERRORES DE VALIDACIÓN:", "error");
          Object.entries(orderData.errors).forEach(([field, errors]) => {
            addLog(`  - ${field}: ${errors.join(", ")}`, "error");
          });
        }

        if (orderData.details) {
          addLog(`📝 Detalles: ${orderData.details}`, "error");
        }
      }
    } catch (error) {
      addLog(`❌ ERROR CRÍTICO: ${error.message}`, "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            🧪 Prueba de Flujo de Pago
          </h1>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              <strong>⚠️ Modo de Prueba</strong>
              <br />
              Este endpoint simula un pago exitoso para probar la creación de envíos.
              <br />
              <strong>Requisito:</strong> Debes tener una cotización completa guardada en localStorage.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Pasos:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Ve a <a href="/cotizador" className="text-blue-600 hover:underline">Cotizador</a> y completa una cotización</li>
              <li>Completa los datos de Remitente y Destinatario</li>
              <li>Vuelve aquí y haz click en "Simular Pago"</li>
              <li>Observa los logs para ver qué sucede</li>
            </ol>
          </div>

          <button
            onClick={testPaymentFlow}
            disabled={loading || !session}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading || !session
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "⏳ Procesando..." : "🧪 Simular Pago y Crear Envío"}
          </button>

          {!session && (
            <p className="mt-3 text-center text-red-600 text-sm">
              ⚠️ Debes iniciar sesión primero
            </p>
          )}

          {logs.length > 0 && (
            <div className="mt-6 bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="text-white font-semibold mb-2">📋 Logs del Proceso:</h3>
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono mb-1 ${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : log.type === "warning"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
