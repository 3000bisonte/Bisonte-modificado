"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import BottomNav from "@/components/BottomNav";

import dayjs from "dayjs";

// Colores y estilos
const ELECTRIC_BLUE = "#0099ff";
const BG_DARK = "#18191A";
const BG_CARD = "#23272b";
const ACCENT = "#41e0b3";

const STATUS_STYLES = {
  RECOLECCION_PENDIENTE: {
    label: "Recolección pendiente",
    color: "bg-blue-100 text-blue-800",
  },
  RECOGIDO_TRANSPORTADORA: {
    label: "Recogido",
    color: "bg-indigo-100 text-indigo-800",
  },
  EN_TRANSPORTE: {
    label: "En Recorrido",
    color: "bg-purple-100 text-purple-800",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "bg-green-100 text-green-800",
  },
  DEVOLUCION: {
    label: "Devolución",
    color: "bg-orange-100 text-orange-800",
  },
  REPROGRAMAR: {
    label: "Reprogramar",
    color: "bg-red-100 text-red-800",
  },
  PENDIENTE: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
  },
};

const getStatusDisplay = (statusKey) => {
  const status = STATUS_STYLES[statusKey] || {
    label: statusKey,
    color: "bg-gray-200 text-gray-700",
  };
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
    >
      {status.label}
    </span>
  );
};

export default function MisEnvios() {
  const { data: session } = useSession();
  const [envios, setEnvios] = useState([]);
  const [search, setSearch] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const userEmail = session?.user?.email;

  // Verificar si viene de un envío exitoso
  useEffect(() => {
    const envioExitoso = localStorage.getItem("envioExitoso");
    if (envioExitoso === "true") {
      setShowSuccessMessage(true);
      localStorage.removeItem("envioExitoso");

      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, []);

  // Cargar historial de envíos del usuario
  useEffect(() => {
    const fetchEnvios = async () => {
      if (!userEmail) return;
      try {
        console.log("🔍 Consultando envíos para usuario:", userEmail);

        // ✅ CAMBIAR ESTA LÍNEA - Usar nueva API para consultar
        const enviosRes = await fetch(
          `/api/envios/historial?email=${encodeURIComponent(userEmail)}`
        );

        if (!enviosRes.ok) {
          throw new Error(`Error ${enviosRes.status}: ${enviosRes.statusText}`);
        }

        const data = await enviosRes.json();
        console.log("✅ Envíos encontrados:", data);

        setEnvios(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("❌ Error al cargar envíos:", e);
        setEnvios([]);
      }
    };
    fetchEnvios();
  }, [userEmail]);

  // Filtrado por búsqueda
  const filteredEnvios = envios.filter((envio) => {
    if (!search) return true; // Si no hay búsqueda, mostrar todos

    const searchTerm = search.toLowerCase().trim();

    // ✅ BUSCAR EN CAMPOS ESPECÍFICOS
    const searchableFields = [
      envio.NumeroGuia?.toLowerCase() || "",
      envio.Origen?.toLowerCase() || "",
      envio.Destino?.toLowerCase() || "",
      envio.Destinatario?.toLowerCase() || "",
      envio.Remitente?.toLowerCase() || "",
      envio.Estado?.toLowerCase() || "",
      // ✅ INCLUIR VERSIONES LEGIBLES DEL ESTADO
      STATUS_STYLES[envio.Estado]?.label?.toLowerCase() || "",
      // ✅ BUSCAR EN FECHA FORMATEADA
      dayjs(envio.FechaSolicitud).isValid()
        ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY").toLowerCase()
        : "",
      dayjs(envio.FechaSolicitud).isValid()
        ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY HH:mm").toLowerCase()
        : "",
    ];

    // ✅ VERIFICAR SI EL TÉRMINO DE BÚSQUEDA ESTÁ EN ALGÚN CAMPO
    return searchableFields.some((field) => field.includes(searchTerm));
  });

  // ✅ FUNCIÓN AUXILIAR PARA RESALTAR TEXTO ENCONTRADO
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-yellow-300 text-black font-bold px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-[#e3dfde] pb-24 pt-0">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          ¡Envío realizado exitosamente! Espere pronta actualización.
        </div>
      )}

      {/* Espacio arriba del header */}
      <div className="h-6" />
      {/* Header igual que Mi Perfil */}
      <div
        className="w-[430px] h-[60px] flex items-center justify-center mx-auto"
        style={{ background: ACCENT }}
      >
        <h2 className="text-white text-xl py-4  font-bold">Mis Envíos</h2>
      </div>
      {/* Encabezado secundario debajo */}
      <div className="bg-[#18191A] py-4 text-center w-[430px] mx-auto">
        <p className="text-white text-base font-semibold">
          Consulta el historial de tus envíos realizados
        </p>
      </div>
      {/* Card */}
      <div className="w-full flex-1 flex flex-col items-center justify-start px-2 md:px-0">
        <div className="w-full max-w-5xl mx-auto bg-[#18191A] rounded-2xl shadow-lg mt-6 p-6 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* ✅ ACTUALIZAR EL INPUT DE BÚSQUEDA */}
            <input
              type="text"
              placeholder="Buscar por número de guía, origen, destino, destinatario, estado o fecha..."
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-700 bg-[#23272b] text-white focus:outline-none focus:ring-2 focus:ring-[#41e0b3] placeholder-gray-400 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Resumen arriba si hay envíos */}
          {filteredEnvios.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-6 bg-[#23272b] rounded-xl p-4 shadow">
              <div className="flex items-center gap-2">
                <svg
                  className="w-7 h-7 text-[#41e0b3]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 7v10c0 1.1.9 2 2 2h14a2 2 0 002-2V7" />
                  <path d="M16 3v4H8V3" />
                  <path d="M3 7h18" />
                </svg>
                <span className="text-white font-semibold">
                  Total envíos:{" "}
                  <span className="text-[#41e0b3]">{filteredEnvios.length}</span>
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_STYLES).map(([key, val]) => {
                  const count = filteredEnvios.filter(
                    (e) => e.Estado === key
                  ).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${val.color} border border-[#23272b]`}
                    >
                      {val.label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl shadow-inner">
            <table className="min-w-full text-sm rounded-xl overflow-hidden">
              <thead>
                <tr style={{ background: ELECTRIC_BLUE }}>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Nº guía
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Origen
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Destino
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Destinatario
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Estado
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEnvios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-400 py-10 bg-[#18191A]"
                    >
                      No hay envíos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredEnvios.map((envio, idx) => (
                    <tr
                      key={envio.NumeroGuia + idx}
                      className={`transition-all ${
                        idx % 2 === 0 ? "bg-[#18191A]" : "bg-[#23272b]"
                      } hover:bg-[#23272b]/90`}
                    >
                      {/* ✅ EN LAS CELDAS DE LA TABLA, REEMPLAZAR: */}
                      <td className="px-3 py-3 text-[#41e0b3] font-mono font-bold">
                        {search ? highlightText(envio.NumeroGuia, search) : envio.NumeroGuia}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {search ? highlightText(envio.Origen, search) : envio.Origen}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {search ? highlightText(envio.Destino, search) : envio.Destino}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {search ? highlightText(envio.Destinatario, search) : envio.Destinatario}
                      </td>
                      <td className="px-3 py-3">
                        {getStatusDisplay(envio.Estado)}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {dayjs(envio.FechaSolicitud).isValid()
                          ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY HH:mm")
                          : "Fecha inválida"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <BottomNav />
          </div>
          {/* ✅ AÑADIR BOTONES DE FILTRO RÁPIDO DESPUÉS DEL INPUT */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSearch('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !search ? 'bg-[#41e0b3] text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Todos
            </button>
            {Object.entries(STATUS_STYLES).map(([key, val]) => {
              const count = envios.filter(e => e.Estado === key).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={key}
                  onClick={() => setSearch(val.label)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    search === val.label ? 'bg-[#41e0b3] text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {val.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
