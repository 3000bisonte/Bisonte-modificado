"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioDestinatario() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    correo: "",
    direccionEntrega: "",
    detalleDireccion: "",
    recomendaciones: "",
    noProhibidos: false,
    aceptaTerminos: false, // Nuevo campo para aceptar términos
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Estado para mostrar el tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  // Al cargar el formulario, recupera lo último guardado
  useEffect(() => {
    const saved = localStorage.getItem("formDestinatario");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // Cada vez que el usuario digita, guarda la última versión
  useEffect(() => {
    localStorage.setItem("formDestinatario", JSON.stringify(formData));
  }, [formData]);

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
        if (!(value || "").trim()) error = "El correo electrónico es obligatorio.";
        else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value.trim()))
          error = "Correo electrónico inválido.";
        break;
      case "celular":
        if (!(value || "").trim()) error = "El celular es obligatorio.";
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
        if (!value) error = "Debes declarar que no envías artículos prohibidos.";
        break;
      case "aceptaTerminos": // Validación para aceptar términos
        if (!value) error = "Debes aceptar los términos y condiciones.";
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setFormData({
      ...formData,
      [name]: fieldValue,
    });
    validateField(name, fieldValue);
  };

  // Nueva función para validar todo el formulario
  const isFormValid = () => {
    // Validar todos los campos requeridos y que no haya errores
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
      formData.aceptaTerminos && // Verificar aceptación de términos
      Object.values(fieldErrors).every((err) => !err)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateDestinatarioFields(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMessage("Por favor corrige los campos marcados en rojo.");
      return;
    }
    // Si todo es válido, navega a la página de resumen
    router.push("/resumen");
  };

  // Handler para el botón Cerrar (ejemplo: volver atrás)
  const handleClose = () => {
    router.back(); // Navega a la página anterior
  };

  return (
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
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Nombre completo del destinatario"
          required
          aria-required="true"
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
          Tipo de Documento
        </label>
        <select
          id="tipoDocumento"
          name="tipoDocumento"
          value={formData.tipoDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          Número de Documento
        </label>
        <input
          id="numeroDocumento"
          type="text"
          name="numeroDocumento"
          placeholder="Número"
          value={formData.numeroDocumento}
          onChange={handleChange}
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          inputMode="numeric"
          pattern="\d*"
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
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="correo@ejemplo.com"
          required
          aria-required="true"
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
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Ej: 3001234567"
          required
          aria-required="true"
          pattern="[0-9]{10}"
          title="Debe ser un número de celular de 10 dígitos"
        />
        {fieldErrors.celular && (
          <span className="text-red-600 text-xs">{fieldErrors.celular}</span>
        )}
      </div>

      {/* Dirección */}
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
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Ej. Calle 50 # 10 - 20, Barrio Ejemplo"
          required
          aria-required="true"
          rows={2}
        />
        {fieldErrors.direccionEntrega && (
          <span className="text-red-600 text-xs">
            {fieldErrors.direccionEntrega}
          </span>
        )}
      </div>

      {/* Detalles Dirección */}
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
          className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {fieldErrors.detalleDireccion && (
          <span className="text-red-600 text-xs">
            {fieldErrors.detalleDireccion}
          </span>
        )}
      </div>

      {/* Checkbox Artículos Prohibidos */}
      <div className="mb-6 flex items-center">
        <input
          id="noProhibidos"
          type="checkbox"
          name="noProhibidos"
          checked={formData.noProhibidos}
          onChange={handleChange}
          className="h-4 w-4 accent-teal-500 focus:ring-teal-500 border-gray-300 rounded mr-2"
          required
          aria-required="true"
        />
        <label htmlFor="noProhibidos" className="text-sm text-gray-700">
          Declaro{" "}
          <strong className="font-semibold text-teal-600">no enviar</strong> artículos
          prohibidos*
        </label>
        {fieldErrors.noProhibidos && (
          <span className="text-red-600 text-xs ml-2">
            {fieldErrors.noProhibidos}
          </span>
        )}
      </div>

      {/* Checkbox Aceptar Términos */}
      <div className="mb-6 flex items-center">
        <input
          id="aceptaTerminos"
          type="checkbox"
          name="aceptaTerminos"
          checked={formData.aceptaTerminos}
          onChange={handleChange}
          className="h-4 w-4 accent-teal-500 focus:ring-teal-500 border-gray-300 rounded mr-2"
          required
          aria-required="true"
        />
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
          <span className="text-red-600 text-xs ml-2">
            {fieldErrors.aceptaTerminos}
          </span>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          onClick={handleClose}
          className="w-full sm:w-auto bg-white hover:bg-gray-100 border border-teal-500 text-teal-500 font-semibold px-6 py-2 rounded shadow hover:shadow-md transition duration-150 ease-in-out order-2 sm:order-1"
        >
          Anterior
        </button>
        <div className="relative w-full sm:w-auto order-1 sm:order-2">
          <button
            type="submit"
            className={`w-full sm:w-auto bg-teal-200 hover:bg-teal-600 text-gray-700 font-semibold px-6 py-2 rounded shadow hover:shadow-md transition duration-150 ease-in-out order-1 sm:order-2 ${
              isLoading || !isFormValid() ? "opacity-50" : ""
            }`}
            onMouseEnter={() => {
              if (!isFormValid()) setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              if (!isFormValid()) {
                e.preventDefault();
                setShowTooltip(true);
              }
            }}
          >
            {isLoading ? (
              <div className="loader inline-block align-middle"></div>
            ) : (
              "Continuar"
            )}
          </button>
          {/* Tooltip */}
          {!isFormValid() && showTooltip && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow z-10 whitespace-nowrap">
              Por favor, rellena todos los campos obligatorios correctamente.
            </div>
          )}
        </div>
      </div>

      {/* Estilos para el Loader (ajustado para botón) */}
      <style jsx>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
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
    </form>
  );
}

function validateDestinatarioFields(formData) {
  const errors = {};
  // Ejemplo de validaciones:
  if (!(formData.nombre || "").trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }
  if (!formData.tipoDocumento) {
    errors.tipoDocumento = "Selecciona el tipo de documento.";
  }
  if (!(formData.numeroDocumento || "").trim()) {
    errors.numeroDocumento = "El número de documento es obligatorio.";
  }
  if (!(formData.celular || "").trim()) {
    errors.celular = "El celular es obligatorio.";
  } else if (!/^3\d{9}$/.test(formData.celular.trim())) {
    errors.celular = "El celular debe empezar con 3 y tener 10 dígitos.";
  }
  if (!(formData.correo || "").trim()) {
    errors.correo = "El correo electrónico es obligatorio.";
  } else if (!/^[\w-.]+@(gmail|hotmail)\.com$/i.test(formData.correo.trim())) {
    errors.correo = "Correo electrónico inválido. Solo gmail.com o hotmail.com";
  }
  // ...agrega más validaciones según tus campos...
  return errors;
}
