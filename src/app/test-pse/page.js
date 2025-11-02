"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestPSEPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);

  const simulatePSEFlow = () => {
    console.log("🏦 Simulando flujo PSE completo...");
    
    // Paso 1: Marcar origen como redirect externo (como lo hace PSE)
    sessionStorage.setItem("origenPago", "redirect_externo");
    console.log("✅ Marcado como redirect_externo");
    
    // Paso 2: Generar un paymentId simulado
    const simulatedPaymentId = `TEST-PSE-${Date.now()}`;
    console.log("✅ Payment ID simulado:", simulatedPaymentId);
    
    setStep(2);
    
    // Paso 3: Simular el redirect del banco de vuelta a la app (después de 2 segundos)
    setTimeout(() => {
      console.log("🔄 Simulando redirect desde el banco...");
      setStep(3);
      
      // Redirigir a la página de success con los parámetros que enviaría el banco
      const successUrl = `/pagos/mercadopago/success?payment_id=${simulatedPaymentId}&status=approved&external_reference=TEST`;
      console.log("🎯 Redirigiendo a:", successUrl);
      
      router.push(successUrl);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            🏦 Simulación de Flujo PSE Completo
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>ℹ️ Cómo Funciona PSE Real:</strong>
              <br />
              1. Usuario selecciona PSE y su banco
              <br />
              2. Se redirige al sitio del banco (sale de tu app)
              <br />
              3. Usuario completa el pago en el banco
              <br />
              4. El banco redirige de vuelta a: <code>/pagos/mercadopago/success</code>
              <br />
              5. Esa página debe crear el envío automáticamente
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              <strong>⚠️ Esta Prueba Simula:</strong>
              <br />
              ✅ Marca el origen como "redirect_externo" (igual que PSE real)
              <br />
              ✅ Genera un paymentId de prueba
              <br />
              ✅ Redirige a /pagos/mercadopago/success con parámetros
              <br />
              ✅ La página success debe crear el envío automáticamente
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Requisitos:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Debes tener una cotización completa guardada (ve a <a href="/cotizador" className="text-blue-600 hover:underline">Cotizador</a>)</li>
              <li>Completa datos de Remitente y Destinatario</li>
              <li>Vuelve aquí y haz click en "Simular Flujo PSE"</li>
              <li>Abre la consola (F12) para ver los logs detallados</li>
            </ol>
          </div>

          {step === 1 && (
            <button
              onClick={simulatePSEFlow}
              disabled={!session}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                !session
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              🏦 Simular Flujo PSE Completo
            </button>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">
                🏦 En el sitio del banco...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                (Simulando proceso de pago)
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✅</div>
              <p className="text-lg font-semibold text-gray-700">
                Pago completado, redirigiendo...
              </p>
            </div>
          )}

          {!session && (
            <p className="mt-3 text-center text-red-600 text-sm">
              ⚠️ Debes iniciar sesión primero
            </p>
          )}

          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">📋 Qué Observar:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>✅ La página debe redirigir a /pagos/mercadopago/success</li>
              <li>✅ La consola debe mostrar logs de creación de envío</li>
              <li>✅ El envío debe aparecer en Mis Envíos</li>
              <li>❌ Si falla, copia TODOS los logs de la consola</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
