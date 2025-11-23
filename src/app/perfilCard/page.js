"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

// Helper inline para normalizar respuestas del API de perfil
const findPerfilByEmail = (response, email) => {
  let perfiles = [];
  if (Array.isArray(response)) {
    perfiles = response;
  } else if (Array.isArray(response?.perfiles)) {
    perfiles = response.perfiles;
  } else if (response?.perfil) {
    perfiles = [response.perfil];
  }
  
  if (!email) return perfiles[0] || null;
  
  const emailLower = email.toLowerCase().trim();
  return perfiles.find(p => 
    (p.email || p.correo || '').toLowerCase().trim() === emailLower
  ) || null;
};

export default function PerfilCard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    email: "",
    direccion: "",
    apartamento: "",
    ciudad: "",
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("⚠️ Usuario no autenticado, redirigiendo a login...");
      router.push("/login");
    }
  }, [status, router]);

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      cargarPerfil();
    }
  }, [status, session]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      console.log("🔄 [PerfilCard] Iniciando carga de perfil para:", session.user.email);
      
      const response = await fetch("/api/perfil", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      console.log("🔄 [PerfilCard] Response status:", response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [PerfilCard] Error HTTP:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ [PerfilCard] Data recibida:", {
        success: data.success,
        message: data.message,
        isNewUser: data.isNewUser,
        perfilesCount: data.perfiles?.length || 0
      });

      const perfil = findPerfilByEmail(data, session.user.email);
      console.log("🔍 [PerfilCard] Perfil encontrado:", perfil ? {
        id: perfil.id,
        email: perfil.email,
        nombre: perfil.nombre || "(vacío)",
        tieneNombre: !!perfil.nombre,
        tieneCelular: !!perfil.celular
      } : "NO ENCONTRADO");

      // ✅ SIEMPRE usar el email de la sesión (fuente de verdad)
      const emailConfiable = session.user.email;
      
      if (perfil) {
        const formulario = {
          nombre: perfil.nombre || "",
          tipoDocumento: perfil.tipoDocumento || "",
          numeroDocumento: perfil.numeroDocumento || "",
          celular: perfil.celular || "",
          email: emailConfiable, // ✅ Email de sesión siempre
          direccion: perfil.direccionRecogida || "",
          apartamento: perfil.detalleDireccion || "",
          ciudad: perfil.ciudad || "",
        };
        
        setForm(formulario);
        
        console.log("✅ [PerfilCard] Formulario inicializado:", {
          email: formulario.email,
          nombre: formulario.nombre || "(vacío)",
          celular: formulario.celular || "(vacío)",
          esNuevoUsuario: data.isNewUser
        });
      } else {
        // Caso excepcional: no debería suceder si la API funciona bien
        console.warn("⚠️ [PerfilCard] findPerfilByEmail no encontró perfil, usando valores por defecto");
        setForm({
          nombre: "",
          tipoDocumento: "",
          numeroDocumento: "",
          celular: "",
          email: emailConfiable,
          direccion: "",
          apartamento: "",
          ciudad: "",
        });
      }
      
      setMsg(""); // Limpiar mensajes de error previos
      
    } catch (error) {
      console.error("❌ [PerfilCard] Error en cargarPerfil:", {
        message: error.message,
        stack: error.stack?.split('\n')[0]
      });
      setMsg("Error al cargar el perfil. Por favor recarga la página.");
      setTimeout(() => setMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validarNombre = (nombre) => {
    if (!nombre || nombre.trim().length === 0) return "El nombre es requerido";
    if (nombre.trim().length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) return "El nombre solo puede contener letras";
    return "";
  };

  const validarCelular = (cel) => {
    if (!cel || cel.trim().length === 0) return "El celular es requerido";
    if (!/^\+?\d{7,15}$/.test(cel.trim())) return "Celular inválido. Debe tener entre 7 y 15 dígitos";
    return "";
  };

  const validarEmail = (email) => {
    if (!email || email.trim().length === 0) return "El correo es requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Correo electrónico inválido";
    return "";
  };

  const validarNumeroDocumento = (num) => {
    if (!num || num.trim().length === 0) return "El número de documento es requerido";
    if (!/^\d{5,20}$/.test(num.trim())) return "Debe tener entre 5 y 20 dígitos";
    return "";
  };

  const validarDireccion = (dir) => {
    if (!dir || dir.trim().length === 0) return "La dirección es requerida";
    if (dir.trim().length < 5) return "La dirección debe tener al menos 5 caracteres";
    return "";
  };

  const validarCiudad = (ciudad) => {
    if (!ciudad || ciudad.trim().length === 0) return "La ciudad es requerida";
    if (ciudad.trim().length < 3) return "La ciudad debe tener al menos 3 caracteres";
    return "";
  };

  // Validar campo en tiempo real mientras el usuario escribe
  const validarCampo = (name, value) => {
    switch (name) {
      case "nombre":
        return validarNombre(value);
      case "celular":
        return validarCelular(value);
      case "email":
        return validarEmail(value);
      case "numeroDocumento":
        return validarNumeroDocumento(value);
      case "direccion":
        return validarDireccion(value);
      case "ciudad":
        return validarCiudad(value);
      case "tipoDocumento":
        return value ? "" : "Debes seleccionar un tipo de documento";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validar en tiempo real mientras el usuario escribe
    const error = validarCampo(name, value);
    const newErrors = { ...errors };
    if (error) {
      newErrors[name] = error;
    } else {
      delete newErrors[name]; // Eliminar la key si no hay error
    }
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Validar cuando el usuario sale del campo
    const error = validarCampo(name, value);
    const newErrors = { ...errors };
    if (error) {
      newErrors[name] = error;
    } else {
      delete newErrors[name]; // Eliminar la key si no hay error
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos EXCEPTO email (que está deshabilitado)
    const newErrors = {
      nombre: validarNombre(form.nombre),
      tipoDocumento: form.tipoDocumento ? "" : "Debes seleccionar un tipo de documento",
      numeroDocumento: validarNumeroDocumento(form.numeroDocumento),
      celular: validarCelular(form.celular),
      // email: NO validar porque el campo está deshabilitado
      direccion: validarDireccion(form.direccion),
      ciudad: validarCiudad(form.ciudad)
    };

    // Filtrar solo los errores que existen
    const erroresActivos = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== "")
    );

    setErrors(erroresActivos);

    // Si hay errores, no continuar
    if (Object.keys(erroresActivos).length > 0) {
      setMsg("⚠️ Por favor corrige los errores del formulario");
      setTimeout(() => setMsg(""), 4000);
      return;
    }

    // Si todo está correcto, guardar
    try {
      setSaving(true);
      console.log("💾 Guardando perfil...", form);

      const response = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Perfil guardado exitosamente:", data);
        setMsg("✅ Perfil actualizado y guardado correctamente");
        setTimeout(() => setMsg(""), 4000);
      } else {
        throw new Error(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("❌ Error guardando perfil:", error);
      setMsg("❌ Error al guardar el perfil. Intenta nuevamente.");
      setTimeout(() => setMsg(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Mostrar pantalla de carga mientras verifica autenticación
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3dfde] to-[#f8fafc]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41e0b3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de carga mientras carga el perfil
  if (loading && status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3dfde] to-[#f8fafc]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41e0b3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#e3dfde] to-[#f8fafc] pb-24">
      <div className="w-full max-w-md mt-8 bg-[#f8fafc] rounded-3xl shadow-xl overflow-hidden border-2 border-[#41e0b3]/30">
        {/* Header principal */}
        <div className="bg-[#41e0b3] py-4 text-center">
          <h2 className="text-white text-xl font-bold">Mi Perfil</h2>
        </div>
        {/* Subtítulo */}
        <div className="bg-[#18191A] py-2 text-center">
          <p className="text-white text-base font-semibold">Edita tu perfil</p>
        </div>
        {/* Mensaje de éxito/error */}
        {msg && (
          <div className={`${msg.includes('✅') ? 'bg-green-100 text-green-700' : msg.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} text-center py-3 px-4 rounded mb-2 mx-4 mt-4 font-semibold`}>
            {msg}
          </div>
        )}
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Nombre *</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Pérez"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.nombre && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.nombre}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Tipo de Documento*
            </label>
            <select
              name="tipoDocumento"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.tipoDocumento ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.tipoDocumento}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="NIT">NIT</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.tipoDocumento && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.tipoDocumento}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Número de Documento*</label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Ej. 123456789"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.numeroDocumento ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.numeroDocumento}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.numeroDocumento && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.numeroDocumento}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Celular*</label>
            <input
              type="tel"
              name="celular"
              placeholder="+57 3001234567"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.celular ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.celular}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.celular && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.celular}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Correo electrónico*</label>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed focus:outline-none"
              value={form.email}
              disabled
              title="El email no se puede cambiar"
            />
            <p className="text-xs text-gray-500 mt-1">📧 El correo electrónico no se puede modificar</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Ciudad*</label>
            <input
              type="text"
              name="ciudad"
              placeholder="Ej. Bogotá, Medellín, Cali"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.ciudad ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.ciudad}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.ciudad && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.ciudad}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Dirección de Recogida*</label>
            <input
              type="text"
              name="direccion"
              placeholder="Ej. Calle 123 #45-67"
              className={`w-full mt-1 px-4 py-2 rounded-lg border ${errors.direccion ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#41e0b3]'} focus:outline-none focus:ring-2 transition`}
              value={form.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {errors.direccion && <span className="text-red-600 text-xs mt-1 block">⚠️ {errors.direccion}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Apartamento/Torre/Conjunto (opcional)
            </label>
            <input
              type="text"
              name="apartamento"
              placeholder="Ej: Torre 5, Apto 301, Conjunto La Colina"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.apartamento}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">📍 Campo opcional para complementar la dirección</p>
          </div>
          
          {/* Resumen de validación */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-semibold mb-2">⚠️ Por favor corrige los siguientes errores:</p>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  error && <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || Object.keys(errors).length > 0}
            className="w-full bg-[#41e0b3] text-white font-bold py-3 rounded-lg mt-2 hover:bg-[#2bbd8c] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              "💾 Guardar Perfil"
            )}
          </button>
        </form>
        <BottomNav />
      </div>
    </div>
  );
}