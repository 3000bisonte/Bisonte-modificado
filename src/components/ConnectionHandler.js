"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectionHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleOffline = () => {
      router.push("/no-conexion");
    };

    const handleOnline = () => {
      if (window.location.pathname === "/no-conexion") {
        router.back();
      }
    };

    // Verificar el estado inicial
    if (!navigator.onLine) {
      router.push("/no-conexion");
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  // Este componente
  return null;
}   