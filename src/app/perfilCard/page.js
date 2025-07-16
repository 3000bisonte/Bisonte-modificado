"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";


export default function PerfilCard() {
  const [form, setForm] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    email: "",
    direccion: "",
    apartamento: "",
  });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!form.nombre || !validarNombre(form.nombre)) newErrors.nombre = "Nombre inválido";
    if (!form.tipoDocumento) newErrors.tipoDocumento = "Selecciona un tipo";
    if (!form.numeroDocumento || !validarNumeroDocumento(form.numeroDocumento)) newErrors.numeroDocumento = "Número inválido";
    if (!form.celular || !validarCelular(form.celular)) newErrors.celular = "Celular inválido";
    if (!form.email || !validarEmail(form.email)) newErrors.email = "Correo inválido";
    if (!form.direccion || !validarDireccion(form.direccion)) newErrors.direccion = "Dirección inválida";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setMsg("Perfil actualizado correctamente");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("");
    }
  };

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
        {/* Mensaje de éxito */}
        {msg && (
          <div className="bg-green-100 text-green-700 text-center py-2 rounded mb-2 mx-4">
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
              className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#41e0b3] transition"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="text-red-600 text-xs">{errors.email}</span>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Dirección de Entrega*</label>
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
            className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded-lg mt-2 hover:bg-[#2bbd8c] transition"
          >
            Editar
          </button>
        </form>
        <BottomNav />
      </div>
    </div>
  );
}