"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import BottomNav from "./BottomNav";

const FormularioRemitente = ({ id }) => {
  const router = useRouter();
  const { data: session } = useSession();
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
        // También guardar en formDataRemitente para compatibilidad
        localStorage.setItem("formDataRemitente", JSON.stringify(data));
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
  }, [isClient]);

  // Cargar datos del perfil del usuario actual desde la sesión
  useEffect(() => {
    if (!session?.user?.email || !isClient) return;
    
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 Buscando perfil del usuario:", session.user.email);
        
        const response = await fetch("/api/perfil");
        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }
        
        const perfiles = await response.json();
        const userProfile = perfiles.find(p => p.correo === session.user.email);
        
        if (userProfile) {
          console.log("👤 Perfil encontrado:", userProfile);
          
          // Solo llenar campos vacíos para no sobreescribir datos ya ingresados
          setFormData((prev) => ({
            nombre: prev.nombre || userProfile.nombre || "",
            tipoDocumento: prev.tipoDocumento || "",
            numeroDocumento: prev.numeroDocumento || "",
            celular: prev.celular || userProfile.celular || "",
            correo: prev.correo || userProfile.correo || session.user.email,
            direccionRecogida: prev.direccionRecogida || "",
            detalleDireccion: prev.detalleDireccion || "",
            recomendaciones: prev.recomendaciones || "",
          }));
        } else {
          console.log("⚠️ No se encontró perfil, usando datos de sesión");
          // Si no hay perfil, al menos llenar el correo de la sesión
          setFormData((prev) => ({
            ...prev,
            correo: prev.correo || session.user.email || "",
          }));
        }
      } catch (error) {
        console.error("❌ Error al cargar datos del perfil:", error);
        // Llenar al menos el correo de la sesión en caso de error
        setFormData((prev) => ({
          ...prev,
          correo: prev.correo || session.user.email || "",
        }));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [session?.user?.email, isClient]);

  // Guardar en localStorage cada vez que cambia el formData
  useEffect(() => {
    if (isClient && Object.values(formData).some(val => val !== "")) {
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
    
    console.log("📤 Datos del remitente guardados:", formData);
    
    // Navega a la página de destinatario
    router.push("/destinatario");
  };

  const canProceed = isFormValid && !isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Información del Remitente</h1>
          <p className="text-gray-600">Completa los datos de quien envía el paquete</p>
          {session?.user?.email && (
            <p className="text-sm text-teal-600 mt-2">
              📧 Usuario: {session.user.email}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-600">Paso 2 de 4</span>
            <span className="text-sm text-gray-500">50% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando datos del perfil...
              </div>
            )}

            {/* Datos Personales Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Datos Personales
              </h3>
              
              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej. Juan Pérez García"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                  }`}
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

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                      fieldErrors.tipoDocumento ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
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
                    <p className="text-red-600 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.tipoDocumento}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    placeholder="Ej. 123456789"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                      fieldErrors.numeroDocumento ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                    }`}
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

            {/* Información de Contacto Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Información de Contacto
              </h3>

              {/* Celular */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Celular <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+57</span>
                  </div>
                  <input
                    type="tel"
                    name="celular"
                    placeholder="3001234567"
                    value={formData.celular}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                      fieldErrors.celular ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.celular && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.celular}
                  </p>
                )}
              </div>

              {/* Correo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="correo"
                  placeholder="ejemplo@gmail.com"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    fieldErrors.correo ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                  }`}
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
            </div>

            {/* Dirección de Recogida Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Dirección de Recogida
              </h3>

              {/* Dirección Principal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Dirección de recogida <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="direccionRecogida"
                  placeholder="Ej. Calle 123 #45-67"
                  value={formData.direccionRecogida}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    fieldErrors.direccionRecogida ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                  }`}
                  required
                />
                {fieldErrors.direccionRecogida && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.direccionRecogida}
                  </p>
                )}
              </div>

              {/* Detalle de Dirección */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Apartamento/Torre/Conjunto <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="detalleDireccion"
                  placeholder="Ej. Torre 5, Apto 301, Conjunto La Colina"
                  value={formData.detalleDireccion}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    fieldErrors.detalleDireccion ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                  }`}
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

            {/* Recomendaciones Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Recomendaciones para la transportadora <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                name="recomendaciones"
                placeholder="Ej. Producto delicado, no voltear, manejar con cuidado..."
                value={formData.recomendaciones}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition-colors ${
                  fieldErrors.recomendaciones ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-teal-500'
                }`}
                rows="3"
                maxLength="100"
              />
              <div className="flex justify-between items-center">
                {fieldErrors.recomendaciones && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.recomendaciones}
                  </p>
                )}
                <span className="text-gray-400 text-sm ml-auto">
                  {formData.recomendaciones.length}/100
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-20">
          <button
            type="button"
            onClick={() => router.push("/cotizador")}
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

        <BottomNav />
      </div>
    </div>
  );
};

export default FormularioRemitente;