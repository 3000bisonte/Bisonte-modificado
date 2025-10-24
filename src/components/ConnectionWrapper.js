"use client";
import { useEffect, useState } from "react";
import NoConnectionLayout from "./NoConnectionLayout";

/**
 * Componente que envuelve toda la aplicación para detectar sin conexión
 * Muestra un layout personalizado cuando no hay internet
 */
export default function ConnectionWrapper({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [hasCheckedInitialConnection, setHasCheckedInitialConnection] = useState(false);

  useEffect(() => {
    // Verificar conexión inicial
    const initialCheck = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setHasCheckedInitialConnection(true);
      
      if (!online) {
        console.log("🔴 [ConnectionWrapper] Sin conexión al iniciar la app");
      } else {
        console.log("🟢 [ConnectionWrapper] Conexión disponible al iniciar");
      }
    };

    initialCheck();

    // Listeners para cambios de conexión
    const handleOnline = () => {
      console.log("✅ [ConnectionWrapper] Conexión restaurada");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("❌ [ConnectionWrapper] Conexión perdida");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificación periódica adicional (cada 5 segundos)
    const intervalId = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        console.log(`🔄 [ConnectionWrapper] Estado cambió a: ${currentStatus ? 'Online' : 'Offline'}`);
        setIsOnline(currentStatus);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  // Mostrar layout de sin conexión si no hay internet
  if (hasCheckedInitialConnection && !isOnline) {
    return (
      <NoConnectionLayout 
        onRetry={() => {
          if (navigator.onLine) {
            setIsOnline(true);
            window.location.reload();
          } else {
            console.log("⚠️ [ConnectionWrapper] Aún sin conexión, no se puede reintentar");
          }
        }} 
      />
    );
  }

  // Renderizar children normalmente si hay conexión
  return <>{children}</>;
}
