// Almacena el puerto compartido
let sharedPort = null;

// Evento de instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado.");
  event.waitUntil(self.skipWaiting()); // Activa el SW inmediatamente.
});

// Evento de activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activado.");
  event.waitUntil(self.clients.claim()); // Control inmediato de todas las páginas.
});

// Escuchar mensajes desde las páginas
// self.addEventListener("message", (event) => {
//   const { port } = event.data;
//   if (port) {
//     // Almacenar el puerto compartido cuando se recibe
//     sharedPort = port;
//     console.log("Puerto almacenado en el Service Worker:", sharedPort);
//   }

//   if (sharedPort) {
//     // Enviar el puerto almacenado a la fuente del mensaje
//     event.source.postMessage({
//       action: "PORT_RETRIEVED",
//       payload: { port: sharedPort },
//     });
//   } else {
//     console.warn("No hay puerto almacenado.");
//   }
// });
