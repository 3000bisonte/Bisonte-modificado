"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function AdminEnvios() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [envios, setEnvios] = useState([]);
  const [actualizando, setActualizando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [envioExpandido, setEnvioExpandido] = useState(null);
  
  // ✅ SISTEMA DE NOTIFICACIONES LOCAL SIMPLE
  const [notification, setNotification] = useState(null);
  
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (session?.user?.email !== "3000bisonte@gmail.com") {
      router.push("/");
    } else {
      loadEnvios();
    }
  }, [session, router]);

  const loadEnvios = () => {
    setLoading(true);
    fetch("/api/envios")
      .then((res) => res.json())
      .then((data) => {
        console.log('✅ Envíos cargados:', data);
        setEnvios(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ Error cargando envíos:', error);
        setLoading(false);
      });
  };

  const handleStatusChange = async (id, nuevoEstado) => {
    console.log('🔄 Cambiando estado:', { id, nuevoEstado });
    
    // ✅ MARCAR COMO ACTUALIZANDO
    setActualizando(id);
    
    // ✅ GUARDAR ESTADO ANTERIOR PARA POSIBLE ROLLBACK
    const estadoAnterior = envios.find(e => e.id === id)?.Estado;
    
    // ✅ ACTUALIZACIÓN OPTIMISTA INMEDIATA
    setEnvios(prevEnvios => 
      prevEnvios.map(envio => 
        envio.id === id 
          ? { ...envio, Estado: nuevoEstado }
          : envio
      )
    );

    try {
      const response = await fetch(`/api/envios/actualizar-estado/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: nuevoEstado })
      });

      console.log('📡 Status de respuesta:', response.status);

      if (!response.ok) {
        // ❌ ROLLBACK - Volver al estado anterior
        setEnvios(prevEnvios => 
          prevEnvios.map(envio => 
            envio.id === id 
              ? { ...envio, Estado: estadoAnterior }
              : envio
          )
        );
        showNotification('❌ Error al actualizar estado', 'error');
        return;
      }

      const result = await response.json();
      console.log('✅ Resultado exitoso:', result);

      // ✅ ÉXITO - Solo mostrar notificación, NO recargar
      showNotification('✅ Estado actualizado correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      
      // ❌ ROLLBACK en caso de error de red
      setEnvios(prevEnvios => 
        prevEnvios.map(envio => 
          envio.id === id 
            ? { ...envio, Estado: estadoAnterior }
            : envio
        )
      );
      showNotification('❌ Error de conexión', 'error');
    } finally {
      setActualizando(null);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER COLORES Y ESTILOS DE CADA ESTADO
  const getEstadoColor = (estado) => {
    const colores = {
      "RECOLECCION_PENDIENTE": "bg-amber-100 text-amber-800 border-amber-200",
      "RECOGIDO_TRANSPORTADORA": "bg-blue-100 text-blue-800 border-blue-200",
      "EN_TRANSPORTE": "bg-purple-100 text-purple-800 border-purple-200",
      "EN_CIUDAD_DESTINO": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "EN_DISTRIBUCION": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "ENTREGADO": "bg-green-100 text-green-800 border-green-200",
      "NO_ENTREGADO": "bg-red-100 text-red-800 border-red-200",
      "REPROGRAMAR": "bg-orange-100 text-orange-800 border-orange-200",
      "DEVOLUCION": "bg-pink-100 text-pink-800 border-pink-200",
      "DEVUELTO_ORIGEN": "bg-rose-100 text-rose-800 border-rose-200",
      "ENVIO_CANCELADO": "bg-slate-100 text-slate-800 border-slate-200",
      "EN_ESPERA_CLIENTE": "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEstadoIcon = (estado) => {
    const iconos = {
      "RECOLECCION_PENDIENTE": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "RECOGIDO_TRANSPORTADORA": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      "EN_TRANSPORTE": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      "EN_CIUDAD_DESTINO": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
      ),
      "EN_DISTRIBUCION": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      "ENTREGADO": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "NO_ENTREGADO": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "REPROGRAMAR": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      "DEVOLUCION": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      "DEVUELTO_ORIGEN": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      ),
      "ENVIO_CANCELADO": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      "EN_ESPERA_CLIENTE": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    };
    return iconos[estado] || null;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      "RECOLECCION_PENDIENTE": "Recolección pendiente",
      "RECOGIDO_TRANSPORTADORA": "Recogido por transportadora",
      "EN_TRANSPORTE": "En transporte",
      "EN_CIUDAD_DESTINO": "En ciudad destino",
      "EN_DISTRIBUCION": "En distribución",
      "ENTREGADO": "Entregado",
      "NO_ENTREGADO": "No entregado",
      "REPROGRAMAR": "Reprogramar",
      "DEVOLUCION": "Devolución",
      "DEVUELTO_ORIGEN": "Devuelto al origen",
      "ENVIO_CANCELADO": "Envío cancelado",
      "EN_ESPERA_CLIENTE": "En espera del cliente"
    };
    return labels[estado] || estado;
  };

  const getEstadisticas = () => {
    const stats = envios.reduce((acc, envio) => {
      acc[envio.Estado] = (acc[envio.Estado] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Cargando envíos...</p>
        </div>
      </div>
    );
  };

  const estadisticas = getEstadisticas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* ✅ CONTAINER PRINCIPAL CON PADDING RESPONSIVO */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* ✅ HEADER MEJORADO Y AJUSTADO */}
        <div className="mb-6 sm:mb-8 mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight drop-shadow">
                  Gestión de Envíos
                </h1>
                <p className="text-slate-600 text-sm sm:text-base mt-1 hidden sm:block">
                  Administra y actualiza el estado de todos los envíos
                </p>
              </div>
            </div>
            {/* Botón de actualización */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadEnvios}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 rounded-lg shadow transition-colors disabled:opacity-50"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
          {/* Descripción móvil */}
          <p className="text-slate-600 text-sm sm:hidden">
            Administra y actualiza el estado de todos los envíos
          </p>
        </div>

        {/* ✅ STATS CARDS CON PADDING MEJORADO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">Total Envíos</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{envios.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">Pendientes</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{estadisticas.RECOLECCION_PENDIENTE || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">En Transporte</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{estadisticas.EN_TRANSPORTE || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">Entregados</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{estadisticas.ENTREGADO || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ TABLA CON PADDING Y SCROLL MEJORADOS */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Lista de Envíos</h2>
          </div>
          
          {envios.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium text-sm sm:text-base">No hay envíos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Número de Guía
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                      Remitente
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                      Destinatario
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                      Rutas
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {envios.map((envio) => (
                    <React.Fragment key={envio.id}>
                      <tr className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-mono font-semibold text-slate-800 text-xs sm:text-sm truncate">{envio.NumeroGuia}</p>
                              <p className="text-xs text-slate-500 truncate">{formatearFecha(envio.FechaSolicitud)}</p>
                              {/* ✅ INFO MÓVIL - Solo en mobile */}
                              <div className="md:hidden mt-1 space-y-1">
                                <p className="text-xs text-slate-600 truncate">📤 {envio.Remitente}</p>
                                <p className="text-xs text-slate-600 truncate">📥 {envio.Destinatario}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-slate-700 text-sm truncate">{envio.Remitente}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-slate-700 text-sm truncate">{envio.Destinatario}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="4"/>
                              </svg>
                              <span className="text-slate-600 truncate max-w-32">{envio.Origen}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="4"/>
                              </svg>
                              <span className="text-slate-600 truncate max-w-32">{envio.Destino}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(envio.Estado)}`}>
                            {getEstadoIcon(envio.Estado)}
                            <span className="ml-1">{getEstadoLabel(envio.Estado)}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {/* ✅ SELECT ESTILIZADO CON OPCIONES COLORIDAS */}
                            <div className="relative">
                              <select
                                key={`${envio.id}-${envio.Estado}`}
                                disabled={actualizando === envio.id}
                                value={envio.Estado}
                                onChange={(ev) => handleStatusChange(envio.id, ev.target.value)}
                                className="appearance-none border border-slate-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 pr-6 sm:pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white min-w-[120px] sm:min-w-[180px] font-medium"
                                style={{ 
                                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundSize: '1.5em 1.5em'
                                }}
                              >
                                <option value="RECOLECCION_PENDIENTE">🕐 Recolección pendiente</option>
                                <option value="RECOGIDO_TRANSPORTADORA">✅ Recogido por transportadora</option>
                                <option value="EN_TRANSPORTE">🚛 En transporte</option>
                                <option value="EN_CIUDAD_DESTINO">🏙️ En ciudad destino</option>
                                <option value="EN_DISTRIBUCION">📦 En distribución</option>
                                <option value="ENTREGADO">✅ Entregado</option>
                                <option value="NO_ENTREGADO">❌ No entregado</option>
                                <option value="REPROGRAMAR">🔄 Reprogramar</option>
                                <option value="DEVOLUCION">↩️ Devolución</option>
                                <option value="DEVUELTO_ORIGEN">⬅️ Devuelto al origen</option>
                                <option value="ENVIO_CANCELADO">🚫 Envío cancelado</option>
                                <option value="EN_ESPERA_CLIENTE">👤 En espera del cliente</option>
                              </select>
                            </div>
                            {actualizando === envio.id && (
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                            )}
                            <button
                              onClick={() => setEnvioExpandido(envioExpandido === envio.id ? null : envio.id)}
                              className="p-1 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                              title="Ver detalles"
                            >
                              <svg className={`w-3 h-3 sm:w-4 sm:h-4 transform transition-transform ${envioExpandido === envio.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ✅ FILA EXPANDIDA CON DETALLES ADICIONALES */}
                      {envioExpandido === envio.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800 flex items-center text-sm sm:text-base">
                                  <svg className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Información del Envío
                                </h4>
                                <div className="space-y-2 text-xs sm:text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Payment ID:</span>
                                    <span className="text-slate-800 font-mono truncate max-w-32">{envio.PaymentId || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Usuario ID:</span>
                                    <span className="text-slate-800 truncate max-w-32">{envio.usuarioId || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Fecha de solicitud:</span>
                                    <span className="text-slate-800 text-right">{formatearFecha(envio.FechaSolicitud)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800 flex items-center text-sm sm:text-base">
                                  <svg className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Direcciones Completas
                                </h4>
                                <div className="space-y-2 text-xs sm:text-sm">
                                  <div>
                                    <span className="text-slate-600 block">Dirección de recogida:</span>
                                    <span className="text-slate-800 break-words">{envio.Origen}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 block">Dirección de entrega:</span>
                                    <span className="text-slate-800 break-words">{envio.Destino}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ NOTIFICACIÓN SIMPLE Y VISUAL */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-3 sm:p-4 rounded-lg shadow-lg max-w-xs sm:max-w-sm transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium pr-2">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-white hover:text-gray-200 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ BOTTOM NAV CON PADDING BOTTOM PARA EVITAR OVERLAP */}
      <div className="pb-16 sm:pb-20">
        <BottomNav />
      </div>

      {/* ✅ ESTILOS PERSONALIZADOS PARA LAS OPCIONES DEL SELECT */}
      <style jsx>{`
        select option {
          padding: 8px 12px;
          font-weight: 500;
        }
        select option[value="RECOLECCION_PENDIENTE"] {
          background-color: #fef3c7;
          color: #92400e;
        }
        select option[value="RECOGIDO_TRANSPORTADORA"] {
          background-color: #dbeafe;
          color: #1e40af;
        }
        select option[value="EN_TRANSPORTE"] {
          background-color: #e9d5ff;
          color: #7c3aed;
        }
        select option[value="EN_CIUDAD_DESTINO"] {
          background-color: #e0e7ff;
          color: #3730a3;
        }
        select option[value="EN_DISTRIBUCION"] {
          background-color: #cffafe;
          color: #155e75;
        }
        select option[value="ENTREGADO"] {
          background-color: #dcfce7;
          color: #166534;
        }
        select option[value="NO_ENTREGADO"] {
          background-color: #fee2e2;
          color: #991b1b;
        }
        select option[value="REPROGRAMAR"] {
          background-color: #fed7aa;
          color: #9a3412;
        }
        select option[value="DEVOLUCION"] {
          background-color: #fce7f3;
          color: #be185d;
        }
        select option[value="DEVUELTO_ORIGEN"] {
          background-color: #fdf2f8;
          color: #be123c;
        }
        select option[value="ENVIO_CANCELADO"] {
          background-color: #f1f5f9;
          color: #475569;
        }
        select option[value="EN_ESPERA_CLIENTE"] {
          background-color: #fefce8;
          color: #a16207;
        }
      `}</style>
    </div>
  );
}