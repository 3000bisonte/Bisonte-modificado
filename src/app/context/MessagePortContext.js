// context/MessagePortContext.js
"use client"; // Este archivo debe ser cliente porque maneja estado React

import { createContext, useContext, useState } from "react";

// Crear el contexto
const MessagePortContext = createContext();

// Proveedor para manejar el estado global del MessagePort
export const MessagePortProvider = ({ children }) => {
  const [port, setPort] = useState(null);
  console.log("port desde MessagePortProvider", port);

  return (
    <MessagePortContext.Provider value={{ port, setPort }}>
      {children}
    </MessagePortContext.Provider>
  );
};

// Hook para usar el contexto en componentes
export const useMessagePort = () => useContext(MessagePortContext);
