"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MercadoPagoFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("❌ [MercadoPago Failure] Usuario llegó desde pago fallido");
    
    // Capturar parámetros de MercadoPago
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    
    console.log("💳 Parámetros de pago:", { paymentId, status });
    
    // Guardar flag de pago rechazado
    localStorage.setItem("pagoRechazado", "true");
    localStorage.setItem("pagoRechazadoMotivo", "El pago fue rechazado por MercadoPago");
    
    if (paymentId) {
      localStorage.setItem("pagoRechazadoId", paymentId);
    }
    
    // Redirigir a Resumen para que el usuario intente de nuevo
    console.log("🔄 Redirigiendo a Resumen...");
    
    // Usar replace para que no puedan volver atrás a esta página
    router.replace("/resumen");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <div className="text-center p-8">
        {/* Animación de error */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-red-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-red-700 mb-3">
          Pago No Procesado ❌
        </h1>
        <p className="text-gray-600 mb-2">
          El pago no pudo ser completado
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo para intentar nuevamente...
        </p>
        
        {/* Spinner de carga */}
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-200 border-t-red-600"></div>
        </div>
      </div>
    </div>
  );
}
