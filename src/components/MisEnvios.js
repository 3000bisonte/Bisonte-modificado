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
      className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
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
    if (!search) return true;

    const searchTerm = search.toLowerCase().trim();

    const searchableFields = [
      envio.NumeroGuia?.toLowerCase() || "",
      envio.Origen?.toLowerCase() || "",
      envio.Destino?.toLowerCase() || "",
      envio.Destinatario?.toLowerCase() || "",
      envio.Remitente?.toLowerCase() || "",
      envio.Estado?.toLowerCase() || "",
      STATUS_STYLES[envio.Estado]?.label?.toLowerCase() || "",
      dayjs(envio.FechaSolicitud).isValid()
        ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY").toLowerCase()
        : "",
      dayjs(envio.FechaSolicitud).isValid()
        ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY HH:mm").toLowerCase()
        : "",
    ];

    return searchableFields.some((field) => field.includes(searchTerm));
  });

  // Función auxiliar para resaltar texto encontrado
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
    <div className="min-h-screen w-full bg-[#e3dfde] pb-20 sm:pb-24 relative">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg animate-bounce text-sm sm:text-base">
          ¡Envío realizado exitosamente! Espere pronta actualización.
        </div>
      )}

      {/* Container principal con responsive */}
      <div className="w-full max-w-[430px] lg:max-w-7xl xl:max-w-8xl mx-auto">
        
        {/* Header responsive */}
        <div className="pt-4 sm:pt-6">
          <div
            className="w-full h-[50px] sm:h-[60px] flex items-center justify-center"
            style={{ background: ACCENT }}
          >
            <h2 className="text-white text-lg sm:text-xl font-bold">Mis Envíos</h2>
          </div>
          
          {/* Encabezado secundario */}
          <div className="bg-[#18191A] py-3 sm:py-4 text-center">
            <p className="text-white text-sm sm:text-base font-semibold px-4">
              Consulta el historial de tus envíos realizados
            </p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6">
          <div className="bg-[#18191A] rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6">
            
            {/* Input de búsqueda */}
            <div className="mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Buscar por número de guía, origen, destino..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-700 bg-[#23272b] text-white focus:outline-none focus:ring-2 focus:ring-[#41e0b3] placeholder-gray-400 text-sm sm:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Botones de filtro rápido */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setSearch('')}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      search === val.label ? 'bg-[#41e0b3] text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    <span className="hidden sm:inline">{val.label} ({count})</span>
                    <span className="sm:hidden">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Resumen (solo cuando hay envíos) */}
            {filteredEnvios.length > 0 && (
              <div className="mb-4 sm:mb-6 bg-[#23272b] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 sm:w-7 sm:h-7 text-[#41e0b3] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 7v10c0 1.1.9 2 2 2h14a2 2 0 002-2V7" />
                      <path d="M16 3v4H8V3" />
                      <path d="M3 7h18" />
                    </svg>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      Total:{" "}
                      <span className="text-[#41e0b3]">{filteredEnvios.length}</span>
                    </span>
                  </div>
                  
                  {/* Estados solo en desktop */}
                  <div className="hidden lg:flex gap-2 flex-wrap">
                    {Object.entries(STATUS_STYLES).map(([key, val]) => {
                      const count = filteredEnvios.filter(
                        (e) => e.Estado === key
                      ).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={key}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${val.color}`}
                        >
                          {val.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla responsive - TODAS LAS COLUMNAS SEPARADAS */}
            <div className="overflow-x-auto rounded-lg sm:rounded-xl shadow-inner">
              <table className="min-w-full text-xs sm:text-sm rounded-xl overflow-hidden">
                <thead>
                  <tr style={{ background: ELECTRIC_BLUE }}>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[100px]">
                      Nº guía
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[120px]">
                      Origen
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[120px]">
                      Destino
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[150px]">
                      Destinatario
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[130px]">
                      Estado
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm min-w-[140px]">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnvios.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-gray-400 py-8 sm:py-10 bg-[#18191A] text-sm sm:text-base"
                      >
                        {envios.length === 0 ? 'No hay envíos registrados.' : 'No se encontraron resultados.'}
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
                        {/* Número de guía */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-[#41e0b3] font-mono font-bold text-xs sm:text-sm">
                          <div className="truncate max-w-[80px] sm:max-w-[100px]">
                            {search ? highlightText(envio.NumeroGuia, search) : envio.NumeroGuia}
                          </div>
                        </td>
                        
                        {/* Origen */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-white text-xs sm:text-sm">
                          <div className="truncate max-w-[100px] sm:max-w-[120px]">
                            {search ? highlightText(envio.Origen, search) : envio.Origen}
                          </div>
                        </td>
                        
                        {/* Destino */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-white text-xs sm:text-sm">
                          <div className="truncate max-w-[100px] sm:max-w-[120px]">
                            {search ? highlightText(envio.Destino, search) : envio.Destino}
                          </div>
                        </td>
                        
                        {/* Destinatario */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-white text-xs sm:text-sm">
                          <div className="truncate max-w-[120px] sm:max-w-[150px]">
                            {search ? highlightText(envio.Destinatario, search) : envio.Destinatario}
                          </div>
                        </td>
                        
                        {/* Estado */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3">
                          {getStatusDisplay(envio.Estado)}
                        </td>
                        
                        {/* Fecha */}
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 text-xs sm:text-sm">
                          <div className="truncate">
                            {dayjs(envio.FechaSolicitud).isValid()
                              ? dayjs(envio.FechaSolicitud).format("DD/MM/YYYY HH:mm")
                              : "Fecha inválida"}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* BottomNav fijo en la parte inferior */}
      <BottomNav />
    </div>
  );
}
