"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MercadoPagoPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("⏳ [MercadoPago Pending] Usuario llegó desde pago pendiente");
    
    // Capturar parámetros de MercadoPago
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    
    console.log("💳 Parámetros de pago:", { paymentId, status });
    
    // Guardar flag de pago pendiente
    localStorage.setItem("pagoPendiente", "true");
    localStorage.setItem("pagoPendienteMotivo", "Tu pago está siendo procesado por el banco");
    
    if (paymentId) {
      localStorage.setItem("pagoPendienteId", paymentId);
    }
    
    // Redirigir a Resumen
    console.log("🔄 Redirigiendo a Resumen...");
    
    // Usar replace para que no puedan volver atrás a esta página
    router.replace("/resumen");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100">
      <div className="text-center p-8">
        {/* Animación de pendiente */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-amber-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-amber-700 mb-3">
          Pago Pendiente ⏳
        </h1>
        <p className="text-gray-600 mb-2">
          Tu pago está siendo procesado
        </p>
        <p className="text-sm text-gray-500">
          Recibirás una notificación cuando se confirme...
        </p>
        
        {/* Spinner de carga */}
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600"></div>
        </div>
      </div>
    </div>
  );
}
