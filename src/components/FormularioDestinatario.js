"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioDestinatario({ id }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);

  // Estado inicial del formulario
  const initialFormData = {
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    correo: "",
    direccionEntrega: "",
    detalleDireccion: "",
    recomendaciones: "",
    noProhibidos: false,
    aceptaTerminos: false,
  };

  const [formData, setFormData] = useState(initialFormData);

  // Función para cargar datos del localStorage de forma segura
  const loadFromLocalStorage = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("formDestinatario");
        if (saved) {
          const parsedData = JSON.parse(saved);
          // Validar que los datos tengan la estructura correcta
          if (typeof parsedData === 'object' && parsedData !== null) {
            return { ...initialFormData, ...parsedData };
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del localStorage:", error);
        // Limpiar localStorage corrupto
        localStorage.removeItem("formDestinatario");
      }
    }
    return initialFormData;
  };

  // Función para guardar en localStorage de forma segura
  const saveToLocalStorage = (data) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("formDestinatario", JSON.stringify(data));
      } catch (error) {
        console.error("Error al guardar en localStorage:", error);
      }
    }
  };

  // Cargar datos iniciales del localStorage
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    setFormData(savedData);
  }, []);

  // Cargar datos del perfil si hay ID, pero preservar datos del localStorage
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/perfil/${id}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        
        const data = await response.json();
        if (!data) return;

        // Solo actualizar campos que estén vacíos en el estado actual
        setFormData((prev) => {
          const updatedData = {
            nombre: prev.nombre || data.nombre || "",
            numeroDocumento: prev.numeroDocumento || data.numero_documento || "",
            tipoDocumento: prev.tipoDocumento || data.tipo_documento || "",
            celular: prev.celular || data.celular || "",
            correo: prev.correo || data.correo || "",
            direccionEntrega: prev.direccionEntrega || data.direccion_entrega || "",
            detalleDireccion: prev.detalleDireccion || data.detalle_direccion || "",
            recomendaciones: prev.recomendaciones || data.recomendaciones || "",
            // Preservar los checkboxes del localStorage
            noProhibidos: prev.noProhibidos,
            aceptaTerminos: prev.aceptaTerminos,
          };
          
          // Guardar inmediatamente en localStorage
          saveToLocalStorage(updatedData);
          return updatedData;
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorMessage("Error al cargar los datos del perfil. Por favor intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Validación de campos individual
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "nombre":
        if (!value.trim()) error = "El nombre completo es obligatorio.";
        else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,40}$/.test(value))
          error = "El nombre completo solo debe contener letras y espacios (2-40 caracteres).";
        break;
      case "tipoDocumento":
        if (!value.trim()) error = "Selecciona el tipo de documento.";
        break;
      case "numeroDocumento":
        if (!value.trim()) error = "El número de documento es obligatorio.";
        else if (!/^\d{6,12}$/.test(value))
          error = "El número de documento debe tener entre 6 y 12 dígitos numéricos.";
        break;
      case "correo":
        if (!value.trim()) error = "El correo electrónico es obligatorio.";
        else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value.trim()))
          error = "Correo electrónico inválido.";
        break;
      case "celular":
        if (!value.trim()) error = "El celular es obligatorio.";
        else if (!/^3\d{9}$/.test(value.trim()))
          error = "El celular debe empezar con 3 y tener 10 dígitos.";
        break;
      case "direccionEntrega":
        if (!value.trim()) error = "La dirección de entrega es obligatoria.";
        else if (value.length < 5 || value.length > 80)
          error = "La dirección debe tener entre 5 y 80 caracteres.";
        break;
      case "detalleDireccion":
        if (value.length > 40)
          error = "El detalle de dirección no debe superar los 40 caracteres.";
        break;
      case "noProhibidos":
        if (!value) error = "Debes declarar que no enviarás artículos prohibidos.";
        break;
      case "aceptaTerminos":
        if (!value) error = "Debes aceptar los términos y condiciones.";
        break;
      default:
        break;
    }
    
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    
    // Actualizar el estado
    const updatedFormData = {
      ...formData,
      [name]: fieldValue,
    };
    
    setFormData(updatedFormData);
    
    // Guardar inmediatamente en localStorage
    saveToLocalStorage(updatedFormData);
    
    // Validar el campo
    validateField(name, fieldValue);
  };

  // Validar todo el formulario
  const isFormValid = () => {
    return (
      formData.nombre.trim() &&
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,40}$/.test(formData.nombre) &&
      formData.tipoDocumento.trim() &&
      formData.numeroDocumento.trim() &&
      /^\d{6,12}$/.test(formData.numeroDocumento) &&
      formData.correo.trim() &&
      /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.correo.trim()) &&
      formData.celular.trim() &&
      /^3\d{9}$/.test(formData.celular) &&
      formData.direccionEntrega.trim() &&
      formData.direccionEntrega.length >= 5 &&
      formData.direccionEntrega.length <= 80 &&
      (!formData.detalleDireccion || formData.detalleDireccion.length <= 40) &&
      formData.noProhibidos &&
      formData.aceptaTerminos &&
      Object.values(fieldErrors).every((err) => !err)
    );
  };

  // Validar todos los campos antes del envío
  const validateAllFields = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach(fieldName => {
      if (!validateField(fieldName, formData[fieldName])) {
        isValid = false;
      }
    });

    // Actualizar errores de campos
    setFieldErrors(prevErrors => ({
      ...prevErrors,
      ...errors
    }));

    return isValid;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateAllFields()) {
      setErrorMessage("Por favor corrige los campos marcados en rojo.");
      return;
    }

    if (!isFormValid()) {
      setErrorMessage("Por favor completa todos los campos obligatorios.");
      return;
    }

    // Guardar una última vez antes de navegar
    saveToLocalStorage(formData);
    
    // Navegar a la página de resumen
    router.push("/resumen");
  };

  // Manejar botón anterior
  const handleClose = () => {
    // Guardar datos antes de salir
    saveToLocalStorage(formData);
    router.back();
  };

  // Limpiar localStorage cuando sea necesario (opcional)
  const clearFormData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("formDestinatario");
      setFormData(initialFormData);
      setFieldErrors({});
    }
  };

  const canProceed = isFormValid() && !isLoading;

  return (
    <div className="relative w-full max-w-md mx-auto">
    
      
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto my-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Datos del Destinatario
        </h2>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}

        {/* Nombre Completo */}
        <div className="mb-4">
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre Completo*
          </label>
          <input
            id="nombre"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nombre completo del destinatario"
            required
          />
          {fieldErrors.nombre && (
            <span className="text-red-600 text-xs">{fieldErrors.nombre}</span>
          )}
        </div>

        {/* Tipo de Documento */}
        <div className="mb-4">
          <label
            htmlFor="tipoDocumento"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo de Documento*
          </label>
          <select
            id="tipoDocumento"
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              fieldErrors.tipoDocumento ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Selecciona...</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="NIT">NIT</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="PA">Pasaporte</option>
          </select>
          {fieldErrors.tipoDocumento && (
            <span className="text-red-600 text-xs">{fieldErrors.tipoDocumento}</span>
          )}
        </div>

        {/* Número de Documento */}
        <div className="mb-4">
          <label
            htmlFor="numeroDocumento"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Número de Documento*
          </label>
          <input
            id="numeroDocumento"
            type="text"
            name="numeroDocumento"
            placeholder="Número"
            value={formData.numeroDocumento}
            onChange={handleChange}
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.numeroDocumento ? 'border-red-500' : 'border-gray-300'
            }`}
            inputMode="numeric"
            pattern="\d*"
            required
          />
          {fieldErrors.numeroDocumento && (
            <span className="text-red-600 text-xs">
              {fieldErrors.numeroDocumento}
            </span>
          )}
        </div>

        {/* Correo Electrónico */}
        <div className="mb-4">
          <label
            htmlFor="correo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Correo Electrónico*
          </label>
          <input
            id="correo"
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.correo ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="correo@ejemplo.com"
            required
          />
          {fieldErrors.correo && (
            <span className="text-red-600 text-xs">{fieldErrors.correo}</span>
          )}
        </div>

        {/* Celular */}
        <div className="mb-4">
          <label
            htmlFor="celular"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Celular*
          </label>
          <input
            id="celular"
            type="tel"
            name="celular"
            value={formData.celular}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.celular ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 3001234567"
            required
            pattern="[0-9]{10}"
            title="Debe ser un número de celular de 10 dígitos"
          />
          {fieldErrors.celular && (
            <span className="text-red-600 text-xs">{fieldErrors.celular}</span>
          )}
        </div>

        {/* Dirección de Entrega */}
        <div className="mb-4">
          <label
            htmlFor="direccionEntrega"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección de Entrega*
          </label>
          <textarea
            id="direccionEntrega"
            name="direccionEntrega"
            value={formData.direccionEntrega}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.direccionEntrega ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej. Calle 50 # 10 - 20, Barrio Ejemplo"
            required
            rows={2}
          />
          {fieldErrors.direccionEntrega && (
            <span className="text-red-600 text-xs">
              {fieldErrors.direccionEntrega}
            </span>
          )}
        </div>

        {/* Detalle de Dirección */}
        <div className="mb-4">
          <label
            htmlFor="detalleDireccion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Apartamento / Torre / Conjunto / Oficina (Opcional)
          </label>
          <input
            id="detalleDireccion"
            type="text"
            name="detalleDireccion"
            placeholder="Ej. Torre 5, Apto 301"
            value={formData.detalleDireccion}
            onChange={handleChange}
            className={`w-full mt-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              fieldErrors.detalleDireccion ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.detalleDireccion && (
            <span className="text-red-600 text-xs">
              {fieldErrors.detalleDireccion}
            </span>
          )}
        </div>

        {/* Checkbox Artículos Prohibidos */}
        <div className="mb-6 flex items-start">
          <input
            id="noProhibidos"
            type="checkbox"
            name="noProhibidos"
            checked={formData.noProhibidos}
            onChange={handleChange}
            className="h-4 w-4 accent-teal-500 focus:ring-teal-500 border-gray-300 rounded mr-2 mt-1"
            required
          />
          <div className="flex-1">
            <label htmlFor="noProhibidos" className="text-sm text-gray-700">
              Declaro{" "}
              <strong className="font-semibold text-teal-600">no enviar</strong> artículos
              prohibidos*
            </label>
            {fieldErrors.noProhibidos && (
              <div className="text-red-600 text-xs mt-1">
                {fieldErrors.noProhibidos}
              </div>
            )}
          </div>
        </div>

        {/* Checkbox Aceptar Términos */}
        <div className="mb-6 flex items-start">
          <input
            id="aceptaTerminos"
            type="checkbox"
            name="aceptaTerminos"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
            className="h-4 w-4 accent-teal-500 focus:ring-teal-500 border-gray-300 rounded mr-2 mt-1"
            required
          />
          <div className="flex-1">
            <label htmlFor="aceptaTerminos" className="text-sm text-gray-700">
              Acepto los{" "}
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline"
              >
                términos y condiciones
              </a>
              *
            </label>
            {fieldErrors.aceptaTerminos && (
              <div className="text-red-600 text-xs mt-1">
                {fieldErrors.aceptaTerminos}
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto bg-white hover:bg-gray-100 border border-teal-500 text-teal-500 font-semibold px-6 py-2 rounded shadow hover:shadow-md transition duration-150 ease-in-out order-2 sm:order-1 disabled:opacity-50"
          >
            Anterior
          </button>
          
          <div className="relative w-full sm:w-auto order-1 sm:order-2">
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`w-full sm:w-auto font-semibold px-6 py-2 rounded shadow hover:shadow-md transition duration-150 ease-in-out ${
                isLoading || !isFormValid() 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
              onMouseEnter={() => {
                if (!isFormValid()) setShowTooltip(true);
              }}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loader inline-block align-middle mr-2"></div>
                  Cargando...
                </div>
              ) : (
                "Continuar"
              )}
            </button>
            
            {/* Tooltip */}
            {!isFormValid() && showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                Por favor, rellena todos los campos obligatorios correctamente.
              </div>
            )}
          </div>
        </div>

        {/* Botón para limpiar datos (opcional - solo para desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={clearFormData}
              className="text-xs text-gray-500 underline"
            >
              Limpiar datos guardados
            </button>
          </div>
        )}
      </form>

      {/* Estilos para el Loader */}
      <style jsx>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #14b8a6;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}