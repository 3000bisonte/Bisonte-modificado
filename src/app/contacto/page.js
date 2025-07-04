"use client";
import { useState } from "react";

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    celular: "",
    email: "",
    ciudad: "",
    mensaje: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes enviar el formulario a tu API o mostrar un mensaje de éxito
    alert("Mensaje enviado correctamente");
    setForm({
      nombre: "",
      tipoDocumento: "",
      numeroDocumento: "",
      celular: "",
      email: "",
      ciudad: "",
      mensaje: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#e3dfde] pb-24">
      <div className="w-full max-w-md mt-8 bg-white rounded-t-lg overflow-hidden shadow">
        <div className="bg-[#41e0b3] py-4 text-center">
          <h2 className="text-white text-xl font-bold">Mis Envios</h2>
        </div>
        <div className="bg-[#18191A] py-4 text-center">
          <p className="text-white text-base">
            Estamos aquí para <span className="font-bold">ayudarte</span>
            <br />
            con tus consultas
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3">
          <div>
            <label className="text-sm font-semibold">Nombre *</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Pérez"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Tipo de Documento*</label>
            <select
              name="tipoDocumento"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
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
          </div>
          <div>
            <label className="text-sm font-semibold">Número de Documento*</label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Ej. 123456789"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.numeroDocumento}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Celular*</label>
            <input
              type="tel"
              name="celular"
              placeholder="+57  Número de celular"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.celular}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Correo electronico*</label>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Ciudad*</label>
            <input
              type="text"
              name="ciudad"
              placeholder="Ej: Bogotá"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.ciudad}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Mensaje</label>
            <textarea
              name="mensaje"
              placeholder="Mensaje"
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 focus:outline-none"
              value={form.mensaje}
              onChange={handleChange}
              rows={2}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded mt-2 hover:bg-[#2bbd8c] transition"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
