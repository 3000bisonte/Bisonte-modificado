"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestPSEStatusPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState("approved");

  const statusOptions = [
    { value: "approved", label: "✅ Aprobado (Exitoso)", color: "green" },
    { value: "pending", label: "⏳ Pendiente (En proceso)", color: "yellow" },
    { value: "in_process", label: "⏳ En Proceso (Esperando confirmación)", color: "yellow" },
    { value: "rejected", label: "❌ Rechazado (Fallido)", color: "red" },
    { value: "cancelled", label: "🚫 Cancelado", color: "gray" },
  ];

  const simulatePSEWithStatus = (status) => {
    console.log(`🏦 Simulando flujo PSE con estado: ${status}`);
    
    // Marcar origen como redirect externo
    sessionStorage.setItem("origenPago", "redirect_externo");
    console.log("✅ Marcado como redirect_externo");
    
    // Generar un paymentId simulado
    const simulatedPaymentId = `TEST-PSE-${status.toUpperCase()}-${Date.now()}`;
    console.log("✅ Payment ID simulado:", simulatedPaymentId);
    
    // Simular redirect con el estado seleccionado
    setTimeout(() => {
      console.log(`🔄 Simulando redirect desde el banco con estado: ${status}`);
      
      const successUrl = `/pagos/mercadopago/success?payment_id=${simulatedPaymentId}&status=${status}&external_reference=TEST-${status}`;
      console.log("🎯 Redirigiendo a:", successUrl);
      
      router.push(successUrl);
    }, 1500);
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      approved: {
        title: "✅ Pago Aprobado",
        desc: "El envío debe crearse automáticamente y aparecer en Mis Envíos",
        expected: "Debe redirigir a /misenvios con el envío creado"
      },
      pending: {
        title: "⏳ Pago Pendiente",
        desc: "El pago está esperando confirmación del banco",
        expected: "NO debe crear el envío todavía. Debe mostrar mensaje de 'pago pendiente' y esperar confirmación"
      },
      in_process: {
        title: "⏳ Pago En Proceso",
        desc: "El pago está siendo procesado por el banco",
        expected: "Similar a 'pending'. NO debe crear el envío hasta que se confirme"
      },
      rejected: {
        title: "❌ Pago Rechazado",
        desc: "El banco rechazó el pago",
        expected: "NO debe crear el envío. Debe mostrar error y permitir reintentar"
      },
      cancelled: {
        title: "🚫 Pago Cancelado",
        desc: "El usuario canceló el pago",
        expected: "NO debe crear el envío. Debe volver al resumen para reintentar"
      }
    };
    return descriptions[status] || {};
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            🏦 Simulador de Estados de Pago PSE
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>ℹ️ Estados Posibles de MercadoPago:</strong>
              <br />
              Esta página te permite simular diferentes estados de pago para ver cómo reacciona la aplicación en cada caso.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Selecciona un Estado:</h2>
            
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStatus === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">
                {getStatusDescription(selectedStatus).title}
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Descripción:</strong> {getStatusDescription(selectedStatus).desc}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Comportamiento Esperado:</strong> {getStatusDescription(selectedStatus).expected}
              </p>
            </div>
          )}

          <button
            onClick={() => simulatePSEWithStatus(selectedStatus)}
            disabled={!session}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              !session
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            🏦 Simular PSE con Estado: {selectedStatus.toUpperCase()}
          </button>

          {!session && (
            <p className="mt-3 text-center text-red-600 text-sm">
              ⚠️ Debes iniciar sesión primero
            </p>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <h3 className="font-semibold mb-2">⚠️ Requisitos Previos:</h3>
            <ol className="text-sm space-y-1 text-gray-700 list-decimal list-inside">
              <li>Tener una cotización completa guardada (ve a <a href="/cotizador" className="text-blue-600 hover:underline">Cotizador</a>)</li>
              <li>Abrir la consola del navegador (F12 &gt; Console)</li>
              <li>Seleccionar el estado que quieres probar</li>
              <li>Click en &quot;Simular PSE&quot;</li>
              <li>Observar el comportamiento y los logs</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400">
            <h3 className="font-semibold mb-2">✅ Qué Observar:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><strong>approved:</strong> Debe crear envío y redirigir a Mis Envíos</li>
              <li><strong>pending/in_process:</strong> NO debe crear envío, debe esperar confirmación</li>
              <li><strong>rejected/cancelled:</strong> NO debe crear envío, debe mostrar error</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
