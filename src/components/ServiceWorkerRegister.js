"use client";

import { useEffect } from "react";

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration);

          // Enviar el puerto al Service Worker al recibirlo
          const handleMessage = (event) => {
            const port = event.ports[0];
            // if (port) {
            //   // Enviar el puerto al Service Worker
            //   registration.active?.postMessage({
            //     action: "SET_PORT",
            //     payload: { port },
            //   });
            //   console.log("Puerto enviado al Service Worker:", port);
            // }
          };

          // Escuchar mensajes desde la TWA o la app
          window.addEventListener("message", handleMessage);

          // Limpiar el listener cuando el componente se desmonte
          return () => {
            window.removeEventListener("message", handleMessage);
          };
        })
        .catch((error) => {
          console.error("Error al registrar el Service Worker:", error);
        });
    }
  }, []);

  return null; // Este componente no necesita renderizar nada.
};

export default ServiceWorkerRegister;
