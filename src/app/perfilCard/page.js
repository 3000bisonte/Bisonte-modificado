"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import BottomNav from "@/components/BottomNav";


export default function PerfilCard() {
  const { data: session, status } = useSession();
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

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      cargarPerfil();
    }
  }, [status, session]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando perfil del usuario...");
      
      const response = await fetch("/api/perfil", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("Error al cargar el perfil");
      }

      const data = await response.json();
      console.log("✅ Perfil cargado:", data);

      if (data.success && data.perfiles && data.perfiles.length > 0) {
        const perfil = data.perfiles[0];
        setForm({
          nombre: perfil.nombre || "",
          tipoDocumento: perfil.tipoDocumento || "",
          numeroDocumento: perfil.numeroDocumento || "",
          celular: perfil.celular || "",
          email: perfil.email || session.user.email,
          direccion: perfil.direccionRecogida || "",
          apartamento: perfil.detalleDireccion || "",
          ciudad: perfil.ciudad || "",
        });
      } else {
        // Si no hay perfil, al menos poner el email
        setForm(prev => ({ ...prev, email: session.user.email }));
      }
    } catch (error) {
      console.error("❌ Error cargando perfil:", error);
      setMsg("Error al cargar el perfil");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validarNombre = (nombre) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim());
  const validarCelular = (cel) => /^\+?\d{7,15}$/.test(cel.trim());
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validarNumeroDocumento = (num) => /^\d{5,20}$/.test(num.trim());
  const validarDireccion = (dir) => dir.trim().length > 4;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.nombre || !validarNombre(form.nombre)) {newErrors.nombre = "Nombre inválido";}
    if (!form.tipoDocumento) {newErrors.tipoDocumento = "Selecciona un tipo";}
    if (!form.numeroDocumento || !validarNumeroDocumento(form.numeroDocumento)) {newErrors.numeroDocumento = "Número inválido";}
    if (!form.celular || !validarCelular(form.celular)) {newErrors.celular = "Celular inválido";}
    if (!form.email || !validarEmail(form.email)) {newErrors.email = "Correo inválido";}
    if (!form.direccion || !validarDireccion(form.direccion)) {newErrors.direccion = "Dirección inválida";}

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
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
    } else {
      setMsg("⚠️ Por favor corrige los errores del formulario");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  if (loading) {
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
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            {errors.nombre && <span className="text-red-600 text-xs">{errors.nombre}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Tipo de Documento*
            </label>
            <select
              name="tipoDocumento"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.tipoDocumento}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="NIT">NIT</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.tipoDocumento && <span className="text-red-600 text-xs">{errors.tipoDocumento}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Número de Documento*</label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Ej. 123456789"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.numeroDocumento}
              onChange={handleChange}
              required
            />
            {errors.numeroDocumento && <span className="text-red-600 text-xs">{errors.numeroDocumento}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Celular*</label>
            <input
              type="tel"
              name="celular"
              placeholder="+57  Número de celular"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.celular}
              onChange={handleChange}
              required
            />
            {errors.celular && <span className="text-red-600 text-xs">{errors.celular}</span>}
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
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.ciudad}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Dirección de Recogida*</label>
            <input
              type="text"
              name="direccion"
              placeholder="Ej. Calle 123 #45-67"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.direccion}
              onChange={handleChange}
              required
            />
            {errors.direccion && <span className="text-red-600 text-xs">{errors.direccion}</span>}
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
          </div>
          <button
            type="submit"
            disabled={saving}
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