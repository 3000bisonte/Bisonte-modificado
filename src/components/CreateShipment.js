import { useState } from 'react';

const CreateShipment = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    packageType: '',
    weight: '',
    date: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.packageType || !formData.weight || !formData.date) {
      setErrorMessage('Por favor, completa todos los campos');
    } else {
      // Simulamos el envío de datos
      console.log('Datos de envío:', formData);
      setErrorMessage('');
      setSuccessMessage('¡Envío creado exitosamente!');
      
      // Limpiar el formulario
      setFormData({
        origin: '',
        destination: '',
        packageType: '',
        weight: '',
        date: ''
      });
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-md shadow-md">
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">
          Crear Nuevo Envío
        </h2>

        {errorMessage && (
          <p className="mb-4 text-sm text-red-500">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="mb-4 text-sm text-green-500">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Campo de Origen */}
          <div className="mb-4">
            <label htmlFor="origin" className="block mb-2 text-sm font-medium text-gray-600">
              Dirección de Origen
            </label>
            <input
              type="text"
              name="origin"
              id="origin"
              value={formData.origin}
              onChange={handleChange}
              placeholder="Ingresa la dirección de origen"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Campo de Destino */}
          <div className="mb-4">
            <label htmlFor="destination" className="block mb-2 text-sm font-medium text-gray-600">
              Dirección de Destino
            </label>
            <input
              type="text"
              name="destination"
              id="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="Ingresa la dirección de destino"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Campo de Tipo de Paquete */}
          <div className="mb-4">
            <label htmlFor="packageType" className="block mb-2 text-sm font-medium text-gray-600">
              Tipo de Paquete
            </label>
            <select
              name="packageType"
              id="packageType"
              value={formData.packageType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">Selecciona un tipo</option>
              <option value="Documentos">Documentos</option>
              <option value="Electrónicos">Electrónicos</option>
              <option value="Ropa">Ropa</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          {/* Campo de Peso */}
          <div className="mb-4">
            <label htmlFor="weight" className="block mb-2 text-sm font-medium text-gray-600">
              Peso del Paquete (kg)
            </label>
            <input
              type="number"
              name="weight"
              id="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Ingresa el peso en kg"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Campo de Fecha de Envío */}
          <div className="mb-4">
            <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-600">
              Fecha de Envío
            </label>
            <input
              type="date"
              name="date"
              id="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Botón de Crear Envío */}
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
          >
            Crear Envío
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateShipment;
