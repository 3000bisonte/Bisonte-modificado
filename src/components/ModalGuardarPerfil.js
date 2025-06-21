"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ModalFormularioPerfil = ({ isOpen, onClose, perf }) => {
  console.log("perf-modal-guar-pwef", perf);
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombrePerfil: "",
    numeroDocumento: "",
    tipoDocumento: "",
    celular: "",
    direccionRecogida: "",
    detalleDireccion: "",
    recomendaciones: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(`/api/perfil/${perf.id}`);
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch profile data");
  //       }
  //       const data = await response.json();
  //       console.log("Fetched data:", data); // Log fetched data
  //       setFormData({
  //         nombrePerfil: data.nombre || "",
  //         numeroDocumento: data.numero_documento || "",
  //         tipoDocumento: data.tipo_documento || "",
  //         celular: data.celular || "",
  //         direccionRecogida: data.direccion_recogida || "",
  //         detalleDireccion: data.detalle_direccion || "",
  //         recomendaciones: data.recomendaciones || "",
  //       });
  //     } catch (error) {
  //       console.error("Error fetching profile data:", error);
  //       setErrorMessage("Failed to load profile data. Please try again.");
  //     }
  //   };

  //   fetchData();
  // }, [perf.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`); // Log each change
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };
      console.log("New form data:", newData); // Log new state
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setIsLoading(true);
      console.log("Submitting form data:", formData); // Log data being submitted
      const combinedData = {
        ...perf,
        ...formData,
      };
      console.log("Submitting combined data:", combinedData);
      const response = await fetch("/api/perfil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(combinedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      const data = await response.json();
      console.log("Data updated successfully:", data);
      setIsLoading(false);
      // Optionally, show a success message or redirect
    } catch (error) {
      console.error("Error updating profile:", error);
      setIsLoading(false);
      setErrorMessage(
        error.message || "An error occurred while updating the profile."
      );
    }
  };
  if (!isOpen) return null;
  return (
    <>
      {/* Fondo oscuro detrás del modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>
      <form
        onSubmit={handleSubmit}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md mx-auto bg-white rounded shadow-lg p-6 max-h-full overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl"
          >
            ✕
          </button>
          <h1 className="text-xl font-bold mb-4 text-blue-500">Perfil</h1>
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
              {errorMessage}
            </div>
          )}
          {/* Mostrar error si existe */}
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
              {errorMessage}
            </div>
          )}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombrePerfil"
              id="nombre"
              placeholder="Ej. Juan Pérez"
              //value={formData.nombrePerfil}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Tipo de documento */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Documento
            </label>
            <select
              name="tipoDocumento"
              //value={formData.tipoDocumento}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un tipo</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
            </select>
          </div>

          {/* Número de documento */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Número de Documento
            </label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Ej. 123456789"
              //value={formData.numeroDocumento}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Celular */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Celular
            </label>
            <input
              type="tel"
              name="celular"
              placeholder="Ej. (123) 456-7890"
              // value={formData.celular}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dirección de recogida */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Dirección de recogida
            </label>
            <input
              type="text"
              name="direccionRecogida"
              placeholder="Ej. Calle 123 #45-67"
              //value={formData.direccionRecogida}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Detalles adicionales */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Apartamento/Torre/Conjunto (opcional)
            </label>
            <input
              type="text"
              name="detalleDireccion"
              placeholder="Ej. Torre 5, Apto 301, Conjunto La Colina"
              //value={formData.detalleDireccion}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recomendaciones */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700">
              Recomendaciones para la transportadora (producto delicado)
            </label>
            <textarea
              name="recomendaciones"
              //value={formData.recomendaciones}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agregue los demás campos del formulario aquí, siguiendo el mismo patrón */}

          <button
            type="submit"
            className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4 ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Editar"}
          </button>
          <style jsx>{`
            .loader {
              border: 4px solid #f3f3f3;
              border-radius: 50%;
              border-top: 4px solid #3498db;
              width: 24px;
              height: 24px;
              animation: spin 2s linear infinite;
            }

            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </form>
    </>
  );
};

export default ModalFormularioPerfil;
