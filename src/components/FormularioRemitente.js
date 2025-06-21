"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const FormularioRemitente = ({ id }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    correo: "",
    direccionRecogida: "",
    detalleDireccion: "",
    recomendaciones: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/perfil/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Log fetched data
        setFormData({
          nombre: data.nombre || "",
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
  }, [id]);

  // Al cargar el formulario, recupera lo último guardado
  useEffect(() => {
    const saved = localStorage.getItem("formRemitente");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // Cada vez que el usuario digita, guarda la última versión
  useEffect(() => {
    localStorage.setItem("formRemitente", JSON.stringify(formData));
  }, [formData]);

  function validateRemitenteFields(data) {
    const errors = {};

    // Nombre: solo letras y espacios, obligatorio
    if (!(data.nombre || "").trim()) {
      errors.nombre = "El nombre es obligatorio.";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.nombre.trim())) {
      errors.nombre = "El nombre solo debe contener letras y espacios.";
    }

    // Tipo de documento: obligatorio
    if (!data.tipoDocumento) {
      errors.tipoDocumento = "Selecciona el tipo de documento.";
    }

    // Número de documento: solo números, obligatorio, entre 5 y 15 dígitos
    if (!(data.numeroDocumento || "").trim()) {
      errors.numeroDocumento = "El número de documento es obligatorio.";
    } else if (!/^\d{5,15}$/.test(data.numeroDocumento.trim())) {
      errors.numeroDocumento = "El número de documento debe tener entre 5 y 15 dígitos numéricos.";
    }

    // Celular: solo números, obligatorio, 10 dígitos, debe empezar por 3
    if (!(data.celular || "").trim()) {
      errors.celular = "El celular es obligatorio.";
    } else if (!/^3\d{9}$/.test(data.celular.trim())) {
      errors.celular = "El celular debe empezar con 3 y tener 10 dígitos.";
    }

    // Correo: obligatorio, formato válido
    if (!(data.correo || "").trim()) {
      errors.correo = "El correo electrónico es obligatorio.";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.correo.trim())) {
      errors.correo = "Correo electrónico inválido.";
    }

    // Dirección de recogida: obligatorio, permite letras, números y algunos símbolos
    if (!(data.direccionRecogida || "").trim()) {
      errors.direccionRecogida = "La dirección de recogida es obligatoria.";
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s#\-\.,]+$/.test(data.direccionRecogida.trim())) {
      errors.direccionRecogida = "La dirección solo debe contener letras, números y los símbolos # - . ,";
    }

    // Apartamento/Torre/Conjunto: opcional, pero si se llena, permite letras, números y algunos símbolos
    if ((data.detalleDireccion || "").trim() && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s#\-\.,]+$/.test(data.detalleDireccion.trim())) {
      errors.detalleDireccion = "Este campo solo debe contener letras, números y los símbolos # - . ,";
    }

    // Recomendaciones: opcional, máximo 100 caracteres
    if ((data.recomendaciones || "").length > 100) {
      errors.recomendaciones = "Las recomendaciones no deben superar los 100 caracteres.";
    }

    return errors;
  }

  const isFormValid = Object.keys(validateRemitenteFields(formData)).length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setFieldErrors(validateRemitenteFields(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    const errors = validateRemitenteFields(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMessage("Por favor corrige los campos marcados en rojo.");
      return;
    }
    // Navega a la página de destinatario
    router.push("/destinatario");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center p-4 w-full max-w-md mx-auto bg-white rounded-lg shadow-md"
    >
      <h2 className="text-lg font-bold mb-4 text-gray-700 text-center">
        Información del remitente
      </h2>
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
          {errorMessage}
        </div>
      )}
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Nombre quien envía<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="nombre"
          placeholder="Ej. Juan Pérez"
          value={formData.nombre}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {fieldErrors.nombre && (
          <span className="text-red-600 text-xs">{fieldErrors.nombre}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Documento<span className="text-red-500">*</span>
        </label>
        <select
          name="tipoDocumento"
          value={formData.tipoDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        >
          <option value="">Selecciona un tipo</option>
          <option value="CC">Cédula de Ciudadanía</option>
          <option value="NIT">NIT</option>
          <option value="CE">Cédula de Extranjería</option>
          <option value="TI">Tarjeta de Identidad</option>
        </select>
        {fieldErrors.tipoDocumento && (
          <span className="text-red-600 text-xs">{fieldErrors.tipoDocumento}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Número de Documento<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="numeroDocumento"
          placeholder="Ej. 123456789"
          value={formData.numeroDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {fieldErrors.numeroDocumento && (
          <span className="text-red-600 text-xs">{fieldErrors.numeroDocumento}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Celular<span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="celular"
          placeholder="+57 Número de celular"
          value={formData.celular}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {fieldErrors.celular && (
          <span className="text-red-600 text-xs">{fieldErrors.celular}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Correo electrónico<span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="correo"
          placeholder="example@gmail.com"
          value={formData.correo}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {fieldErrors.correo && (
          <span className="text-red-600 text-xs">{fieldErrors.correo}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Dirección de recogida<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="direccionRecogida"
          placeholder="Ej. Calle 123 #45-67"
          value={formData.direccionRecogida}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {fieldErrors.direccionRecogida && (
          <span className="text-red-600 text-xs">{fieldErrors.direccionRecogida}</span>
        )}
      </div>
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
        {fieldErrors.detalleDireccion && (
          <span className="text-red-600 text-xs">{fieldErrors.detalleDireccion}</span>
        )}
      </div>
      <div className="mb-4 w-full">
        <label className="block text-sm font-medium text-gray-700">
          Recomendaciones para la transportadora (producto delicado)
        </label>
        <textarea
          name="recomendaciones"
          placeholder="Ej. Producto delicado, no voltear"
          value={formData.recomendaciones}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {fieldErrors.recomendaciones && (
          <span className="text-red-600 text-xs">{fieldErrors.recomendaciones}</span>
        )}
      </div>
      <button
        type="submit"
        className={`w-full py-3 text-lg font-semibold bg-teal-500 text-white rounded-lg mt-2
          ${!isFormValid || isLoading ? "bg-gray-200 cursor-not-allowed" : "hover:bg-teal-600"}`}
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? "Guardando..." : "Continuar"}
      </button>
    </form>
  );
};

export default FormularioRemitente;
