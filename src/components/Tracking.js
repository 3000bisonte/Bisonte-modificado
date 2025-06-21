import { useState } from 'react';

const Tracking = () => {
  // Simulamos los detalles de un pedido
  const [shipment, setShipment] = useState({
    id: 1,
    origin: 'Carrera 10 #22-30, Bogotá',
    destination: 'Calle 50 #20-15, Bogotá',
    status: 'En tránsito',
    driver: {
      name: 'Juan Pérez',
      photo: 'https://via.placeholder.com/100', // Simulamos una imagen de un conductor
      contact: '1234567890',
      vehicle: 'Moto',
    },
    estimatedDeliveryTime: '15 minutos',
    mapUrl: 'https://via.placeholder.com/500', 
  });

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-4xl p-6 bg-white rounded-md shadow-md">
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">
          Rastreo de Pedido
        </h2>

        {/* Información del Pedido */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Detalles del Pedido</h3>
          <p><strong>ID de Pedido:</strong> {shipment.id}</p>
          <p><strong>Origen:</strong> {shipment.origin}</p>
          <p><strong>Destino:</strong> {shipment.destination}</p>
          <p><strong>Estado:</strong> {shipment.status}</p>
          <p><strong>Tiempo Estimado de Entrega:</strong> {shipment.estimatedDeliveryTime}</p>
        </div>

        {/* Mapa */}
        <div className="mb-4">
          <img src={shipment.mapUrl} alt="Mapa de Rastreo" className="rounded-md" />
          <p className="text-center text-gray-500">Ubicación actual del paquete</p>
        </div>

        {/* Información del Conductor */}
        <div className="flex items-center mb-4">
          <img src={shipment.driver.photo} alt="Conductor" className="w-16 h-16 rounded-full mr-4" />
          <div>
            <h3 className="font-semibold">{shipment.driver.name}</h3>
            <p><strong>Vehículo:</strong> {shipment.driver.vehicle}</p>
            <p><strong>Contacto:</strong> {shipment.driver.contact}</p>
          </div>
        </div>

        {/* Botón para Contactar al Mensajero */}
        <button className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
          Contactar al Mensajero
        </button>
      </div>
    </div>
  );
};

export default Tracking;
