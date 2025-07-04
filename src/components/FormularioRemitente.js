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
  const [isClient, setIsClient] = useState(false);

  // Verificar que estamos en el cliente para evitar errores de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para guardar en localStorage de manera segura
  const saveToLocalStorage = (data) => {
    if (typeof window !== 'undefined' && isClient) {
      try {
        localStorage.setItem("formRemitente", JSON.stringify(data));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  };

  // Función para cargar desde localStorage de manera segura
  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined' && isClient) {
      try {
        const saved = localStorage.getItem("formRemitente");
        return saved ? JSON.parse(saved) : null;
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        return null;
      }
    }
    return null;
  };

  // Cargar datos del localStorage cuando el componente se monta
  useEffect(() => {
    if (!isClient) return;

    const savedData = loadFromLocalStorage();
    if (savedData) {
      // Solo cargar si los campos actuales están vacíos
      const isFormEmpty = Object.values(formData).every(val => val === "");
      if (isFormEmpty) {
        setFormData(savedData);
      }
    }
  }, [isClient]); // Removido formData de las dependencias para evitar loops

  // Cargar datos del perfil si hay un ID
  useEffect(() => {
    if (!id || !isClient) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/perfil/${id}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        const data = await response.json();
        
        if (data) {
          setFormData((prev) => ({
            ...prev,
            nombre: prev.nombre || data.nombre || "",
            numeroDocumento: prev.numeroDocumento || data.numero_documento || "",
            tipoDocumento: prev.tipoDocumento || data.tipo_documento || "",
            celular: prev.celular || data.celular || "",
            direccionRecogida: prev.direccionRecogida || data.direccion_recogida || "",
            detalleDireccion: prev.detalleDireccion || data.detalle_direccion || "",
            recomendaciones: prev.recomendaciones || data.recomendaciones || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorMessage("Error al cargar los datos del perfil. Por favor intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isClient]);

  // Guardar en localStorage cada vez que cambia el formData
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage(formData);
    }
  }, [formData, isClient]);

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
    
    // Validar solo el campo que cambió para mejor UX
    const allErrors = validateRemitenteFields(updated);
    setFieldErrors(allErrors);
    
    // Limpiar mensaje de error general si el usuario está corrigiendo
    if (errorMessage) {
      setErrorMessage("");
    }
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

  // Función para limpiar localStorage (útil para debugging o reset)
  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem("formRemitente");
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }
    }
  };

  const canProceed = isFormValid && !isLoading;

  return (
    <div className="relative w-full max-w-md mx-auto">
    
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center p-4 w-full bg-white rounded-lg shadow-md"
      >
        <h2 className="text-lg font-bold mb-4 text-gray-700 text-center">
          Información del remitente
        </h2>
        
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded w-full">
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.nombre && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.nombre}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.tipoDocumento ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Selecciona un tipo</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="NIT">NIT</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="TI">Tarjeta de Identidad</option>
          </select>
          {fieldErrors.tipoDocumento && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.tipoDocumento}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.numeroDocumento ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.numeroDocumento && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.numeroDocumento}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.celular ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.celular && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.celular}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.correo ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.correo && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.correo}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.direccionRecogida ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.direccionRecogida && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.direccionRecogida}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.detalleDireccion ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.detalleDireccion && (
            <span className="text-red-600 text-xs mt-1 block">{fieldErrors.detalleDireccion}</span>
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
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
              fieldErrors.recomendaciones ? 'border-red-500' : 'border-gray-300'
            }`}
            rows="3"
            maxLength="100"
          />
          <div className="flex justify-between items-center mt-1">
            {fieldErrors.recomendaciones && (
              <span className="text-red-600 text-xs">{fieldErrors.recomendaciones}</span>
            )}
            <span className="text-gray-500 text-xs ml-auto">
              {formData.recomendaciones.length}/100
            </span>
          </div>
        </div>

        <div className="flex justify-between w-full mt-6">
          {/* Botón Anterior */}
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold"
            onClick={() => router.push("/cotizador")}
          >
            Anterior
          </button>
          {/* Botón Continuar */}
          <button
            type="submit"
            className={`bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded font-semibold transition ${
              !isFormValid || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Cargando..." : "Continuar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioRemitente;