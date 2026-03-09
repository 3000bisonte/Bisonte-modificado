"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import BottomNav from "@/components/BottomNav";

// Helper para normalizar respuestas del API de perfil
const findPerfilByEmail = (response, email) => {
  let perfiles = [];
  if (Array.isArray(response)) perfiles = response;
  else if (Array.isArray(response?.perfiles)) perfiles = response.perfiles;
  else if (response?.perfil) perfiles = [response.perfil];
  if (!email) return perfiles[0] || null;
  const emailLower = email.toLowerCase().trim();
  return perfiles.find(p => (p.email || p.correo || '').toLowerCase().trim() === emailLower) || null;
};

export default function Contacto() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    ciudad: "",
    mensaje: "",
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  // Auto-completar datos del usuario logueado desde su perfil
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchUserProfile = async () => {
      try {
        setCargandoPerfil(true);
        const response = await fetch("/api/perfil");
        if (!response.ok) return;

        const data = await response.json();
        const perfil = findPerfilByEmail(data, session.user.email);

        if (perfil) {
          setForm((prev) => ({
            nombre: prev.nombre || perfil.nombre || "",
            tipoDocumento: prev.tipoDocumento || perfil.tipoDocumento || perfil.tipo_documento || "",
            numeroDocumento: prev.numeroDocumento || perfil.numeroDocumento || perfil.numero_documento || "",
            celular: prev.celular || perfil.celular || "",
            ciudad: prev.ciudad || perfil.ciudad || "",
            mensaje: prev.mensaje || "",
          }));
          console.log("✅ Formulario de contacto auto-completado con datos del perfil");
        }
      } catch (error) {
        console.error("Error al cargar perfil del usuario:", error);
      } finally {
        setCargandoPerfil(false);
      }
    };

    fetchUserProfile();
  }, [session?.user?.email]);

  // Validaciones
  const validarNombre = (nombre) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim());
  const validarCelular = (cel) => /^\+?\d{7,15}$/.test(cel.trim());
  const validarNumeroDocumento = (num) => /^\d{5,20}$/.test(num.trim());
  const validarCiudad = (ciudad) => ciudad.trim().length > 2;
  const validarMensaje = (mensaje) => mensaje.trim().length > 5;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    // Validaciones
    const newErrors = {};
    if (!form.nombre || !validarNombre(form.nombre))
      {newErrors.nombre = "Nombre inválido";}
    if (!form.tipoDocumento)
      {newErrors.tipoDocumento = "Selecciona un tipo de documento";}
    if (
      !form.numeroDocumento ||
      !validarNumeroDocumento(form.numeroDocumento)
    )
      {newErrors.numeroDocumento = "Número de documento inválido";}
    if (!form.celular || !validarCelular(form.celular))
      {newErrors.celular = "Celular inválido";}
    if (!form.ciudad || !validarCiudad(form.ciudad))
      {newErrors.ciudad = "Ciudad inválida";}
    if (!form.mensaje || !validarMensaje(form.mensaje))
      {newErrors.mensaje = "El mensaje es obligatorio";}

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("/api/contacto", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: form.nombre,
            tipo_documento: form.tipoDocumento,
            numero_documento: form.numeroDocumento,
            celular: form.celular,
            ciudad: form.ciudad,
            email: session?.user?.email || null,
            correo: session?.user?.email || "anonimo@bisonte.com",
            mensaje: form.mensaje,
          }),
        });

        if (response.ok) {
          setMsg("Mensaje enviado correctamente");
          setForm({
            nombre: "",
            tipoDocumento: "",
            numeroDocumento: "",
            celular: "",
            ciudad: "",
            mensaje: "",
          });
          setTimeout(() => setMsg(""), 3000);
        } else {
          setMsg("Error al enviar el mensaje");
        }
      } catch (error) {
        console.error("Error:", error);
        setMsg("Error al enviar el mensaje");
      }
    }

    setEnviando(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#e3dfde] to-[#f8fafc] pb-24">
      <div className="w-full max-w-md mt-8 bg-[#f8fafc] rounded-3xl shadow-xl overflow-hidden border-2 border-[#41e0b3]/30">
        {/* Header principal */}
        <div className="bg-[#41e0b3] text-white px-6 py-4">
          <h1 className="text-xl font-bold text-center">Contacto</h1>
        </div>
        {/* Subtítulo */}
        <div className="bg-[#18191A] py-2 text-center">
          <p className="text-white text-base font-semibold">
            Envíanos tu mensaje
          </p>
        </div>
        {/* Mostrar email del usuario logueado */}
        {session?.user?.email && (
          <div className="px-6 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Contactando como:{" "}
              <span className="font-semibold">{session.user.email}</span>
            </p>
          </div>
        )}
        {msg && (
          <div
            className={`text-center py-2 ${
              msg.includes("correctamente")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {msg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Nombre*
            </label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej: Juan Pérez"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            {errors.nombre && (
              <span className="text-red-600 text-xs">{errors.nombre}</span>
            )}
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
              <option value="">Selecciona</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="NIT">NIT</option>
              <option value="PEP">PEP</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.tipoDocumento && (
              <span className="text-red-600 text-xs">
                {errors.tipoDocumento}
              </span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Número de Documento*
            </label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Ej: 123456789"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.numeroDocumento}
              onChange={handleChange}
              required
            />
            {errors.numeroDocumento && (
              <span className="text-red-600 text-xs">
                {errors.numeroDocumento}
              </span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Celular*
            </label>
            <input
              type="tel"
              name="celular"
              placeholder="+57  Número de celular"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.celular}
              onChange={handleChange}
              required
            />
            {errors.celular && (
              <span className="text-red-600 text-xs">{errors.celular}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Ciudad*
            </label>
            <input
              type="text"
              name="ciudad"
              placeholder="Ej: Bogotá"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.ciudad}
              onChange={handleChange}
              required
            />
            {errors.ciudad && (
              <span className="text-red-600 text-xs">{errors.ciudad}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Mensaje*
            </label>
            <textarea
              name="mensaje"
              placeholder="Mensaje"
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.mensaje}
              onChange={handleChange}
              rows={3}
              required
            />
            {errors.mensaje && (
              <span className="text-red-600 text-xs">{errors.mensaje}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded-lg mt-2 hover:bg-[#2bbd8c] transition disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
        </form>
        <BottomNav />
      </div>
    </div>
  );
}
