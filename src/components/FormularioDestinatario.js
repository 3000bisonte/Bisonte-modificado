"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./BottomNav";

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
          if (typeof parsedData === "object" && parsedData !== null) {
            return { ...initialFormData, ...parsedData };
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del localStorage:", error);
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
            noProhibidos: prev.noProhibidos,
            aceptaTerminos: prev.aceptaTerminos,
          };

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

    const updatedFormData = {
      ...formData,
      [name]: fieldValue,
    };

    setFormData(updatedFormData);
    saveToLocalStorage(updatedFormData);
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

    Object.keys(formData).forEach((fieldName) => {
      if (!validateField(fieldName, formData[fieldName])) {
        isValid = false;
      }
    });

    setFieldErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
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

    saveToLocalStorage(formData);
    router.push("/resumen");
  };

  // Manejar botón anterior
  const handleClose = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Datos del Destinatario
          </h1>
          <p className="text-gray-600">
            Completa la información para realizar la entrega
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-600">Paso 3 de 4</span>
            <span className="text-sm text-gray-500">75% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Información Personal */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información Personal
              </h3>
            </div>

            {/* Nombre Completo */}
            <div className="space-y-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre Completo*
              </label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  fieldErrors.nombre ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
                placeholder="Ingresa el nombre completo del destinatario"
                required
              />
              {fieldErrors.nombre && (
                <p className="text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.nombre}
                </p>
              )}
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tipoDocumento" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento*
                </label>
                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    fieldErrors.tipoDocumento ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
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
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.tipoDocumento}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700">
                  Número de Documento*
                </label>
                <input
                  id="numeroDocumento"
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    fieldErrors.numeroDocumento ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="Número de documento"
                  inputMode="numeric"
                  pattern="\d*"
                  required
                />
                {fieldErrors.numeroDocumento && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.numeroDocumento}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Información de Contacto
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico*
                </label>
                <input
                  id="correo"
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    fieldErrors.correo ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="correo@ejemplo.com"
                  required
                />
                {fieldErrors.correo && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.correo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="celular" className="block text-sm font-medium text-gray-700">
                  Celular*
                </label>
                <input
                  id="celular"
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    fieldErrors.celular ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="3001234567"
                  required
                  pattern="[0-9]{10}"
                />
                {fieldErrors.celular && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.celular}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección de Entrega */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Dirección de Entrega
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="direccionEntrega" className="block text-sm font-medium text-gray-700">
                  Dirección Principal*
                </label>
                <textarea
                  id="direccionEntrega"
                  name="direccionEntrega"
                  value={formData.direccionEntrega}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors resize-none ${
                    fieldErrors.direccionEntrega ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="Ej. Calle 50 # 10 - 20, Barrio Ejemplo"
                  rows={3}
                  required
                />
                {fieldErrors.direccionEntrega && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.direccionEntrega}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="detalleDireccion" className="block text-sm font-medium text-gray-700">
                  Detalle Adicional <span className="text-gray-400 text-xs">(Opcional)</span>
                </label>
                <input
                  id="detalleDireccion"
                  type="text"
                  name="detalleDireccion"
                  value={formData.detalleDireccion}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    fieldErrors.detalleDireccion ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="Ej. Torre 5, Apto 301, Oficina 102"
                />
                {fieldErrors.detalleDireccion && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.detalleDireccion}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Términos y Condiciones
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  id="noProhibidos"
                  type="checkbox"
                  name="noProhibidos"
                  checked={formData.noProhibidos}
                  onChange={handleChange}
                  className="h-5 w-5 mt-0.5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  required
                />
                <div className="flex-1">
                  <label htmlFor="noProhibidos" className="text-sm text-gray-700 cursor-pointer">
                    Declaro <strong className="font-semibold text-teal-600">no enviar</strong> artículos prohibidos*
                  </label>
                  {fieldErrors.noProhibidos && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.noProhibidos}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="aceptaTerminos"
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
                  className="h-5 w-5 mt-0.5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  required
                />
                <div className="flex-1">
                  <label htmlFor="aceptaTerminos" className="text-sm text-gray-700 cursor-pointer">
                    Acepto los{" "}
                    <a
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 underline font-medium"
                    >
                      términos y condiciones
                    </a>
                    *
                  </label>
                  {fieldErrors.aceptaTerminos && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.aceptaTerminos}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 mb-20">
            <button
              type="button"
              onClick={() => router.push("/remitente/edit/9")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                isFormValid && !isLoading
                  ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando...
                </>
              ) : (
                <>
                  Continuar
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Tooltip mejorado */}
          {!isFormValid() && showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap">
              <div className="relative">
                Por favor, completa todos los campos obligatorios correctamente
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          )}

          {/* Botón para limpiar datos (solo desarrollo) */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={clearFormData}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
              >
                🔧 Limpiar datos guardados (Dev)
              </button>
            </div>
          )}
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
