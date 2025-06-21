import { useState } from "react";
import CreateShipment from "./CreateShipment";
//import ShipmentHistory from './ShipmentHistory';
import Tracking from "./Tracking"; // Importamos el componente de rastreo

const Dashboard = () => {
  const [view, setView] = useState("dashboard");

  if (view === "createShipment") {
    return <CreateShipment />;
  }

  if (view === "history") {
    //return <ShipmentHistory />;
  }

  if (view === "tracking") {
    return <Tracking />;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-2xl p-6 bg-white rounded-md shadow-md">
        <h2 className="mb-6 text-3xl font-semibold text-center text-gray-700">
          Bienvenido al Panel de Control
        </h2>

        {/* Opciones del Dashboard */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <button
            className="w-full px-4 py-6 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
            onClick={() => setView("tracking")} // Cambiamos la acción para el rastreo
          >
            Rastreo de Pedido
          </button>

          <button
            className="w-full px-4 py-6 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-600"
            onClick={() => setView("createShipment")}
          >
            Crear Nuevo Envío
          </button>

          <button
            className="w-full px-4 py-6 text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:bg-yellow-600"
            onClick={() => setView("history")}
          >
            Historial
          </button>

          <button
            className="w-full px-4 py-6 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:bg-red-600"
            onClick={() => alert("Cerrar Sesión")}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
