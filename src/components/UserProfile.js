"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Profile = ({ params }) => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/perfil/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Log fetched data
        setFormData({
          nombrePerfil: data.nombre || "",
          numeroDocumento: data.numero_documento || "",
          tipoDocumento: data.tipo_documento || "",
          celular: data.celular || "",
          direccionRecogida: data.direccion_recogida || "",
          detalleDireccion: data.detalle_direccion || "",
          recomendaciones: data.recomendaciones || "",
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorMessage("Failed to load profile data. Please try again.");
      }
    };

    fetchData();
  }, [params.id]);

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
    try {
      setIsLoading(true);
      console.log("Submitting form data:", formData); // Log data being submitted
      const response = await fetch(`/api/perfil/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center p-4 w-full max-w-md mx-auto bg-white rounded shadow-md"
    >
      <h1 className="text-xl font-bold mb-4 text-teal-500">Mi perfil</h1>
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
          {errorMessage}
        </div>
      )}
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Nombre en la guía
        </label>
        <input
          type="text"
          name="nombrePerfil"
          id="nombre"
          placeholder="Ej. Juan Pérez"
          value={formData.nombrePerfil}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      {/* Tipo de documento */}
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Documento
        </label>
        <select
          name="tipoDocumento"
          value={formData.tipoDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          value={formData.numeroDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          value={formData.celular}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          value={formData.direccionRecogida}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          value={formData.detalleDireccion}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Recomendaciones */}
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Recomendaciones para la transportadora (producto delicado)
        </label>
        <textarea
          name="recomendaciones"
          value={formData.recomendaciones}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Agregue los demás campos del formulario aquí, siguiendo el mismo patrón */}

      <button
        type="submit"
        className={`bg-teal-200 text-gray-700 p-2 rounded hover:bg-teal-600 mt-4 ${
          isLoading ? "cursor-not-allowed opacity-50" : ""
        }`}
        disabled={isLoading}
      >
        {isLoading ? "Actualizando..." : "Editar"}
      </button>
    </form>
  );
};

export default Profile;
