"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MercadoPagoSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("✅ [MercadoPago Success] Usuario llegó desde pago exitoso");
    
    // Capturar parámetros de MercadoPago
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    const externalReference = searchParams.get("external_reference");
    
    console.log("💳 Parámetros de pago:", { paymentId, status, externalReference });
    
    // Guardar en localStorage para que MisEnvios lo detecte
    localStorage.setItem("envioExitoso", "true");
    
    if (paymentId) {
      localStorage.setItem("pagoId", paymentId);
    }
    
    if (externalReference) {
      localStorage.setItem("ultimoEnvioId", externalReference);
    }
    
    // Redirigir a Mis Envíos
    console.log("🔄 Redirigiendo a Mis Envíos...");
    
    // Usar replace para que no puedan volver atrás a esta página
    router.replace("/misenvios");
  }, [router, searchParams]);

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
          ¡Pago Exitoso! 🎉
        </h1>
        <p className="text-gray-600 mb-2">
          Tu pago se procesó correctamente
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
