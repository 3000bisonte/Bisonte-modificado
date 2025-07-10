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

  const getEstadoColor = (estado) => {
    const colores = {
      "RECOLECCION_PENDIENTE": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "EN_TRANSPORTE": "bg-blue-100 text-blue-800 border-blue-200",
      "ENTREGADO": "bg-green-100 text-green-800 border-green-200",
      "DEVOLUCION": "bg-red-100 text-red-800 border-red-200"
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
      "EN_TRANSPORTE": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      "ENTREGADO": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      "DEVOLUCION": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      )
    };
    return iconos[estado] || null;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      "RECOLECCION_PENDIENTE": "Recolección pendiente",
      "EN_TRANSPORTE": "En transporte",
      "ENTREGADO": "Entregado",
      "DEVOLUCION": "Devolución"
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
  }

  const estadisticas = getEstadisticas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Envíos</h1>
          </div>
          <p className="text-slate-600">Administra y actualiza el estado de todos los envíos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Envíos</p>
                <p className="text-3xl font-bold text-slate-800">{envios.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{estadisticas.RECOLECCION_PENDIENTE || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">En Transporte</p>
                <p className="text-3xl font-bold text-blue-600">{estadisticas.EN_TRANSPORTE || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Entregados</p>
                <p className="text-3xl font-bold text-green-600">{estadisticas.ENTREGADO || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Envíos Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Lista de Envíos</h2>
          </div>
          
          {envios.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No hay envíos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Número de Guía
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Remitente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Destinatario
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Rutas
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {envios.map((envio) => (
                    <React.Fragment key={envio.id}>
                      <tr className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-slate-800">{envio.NumeroGuia}</p>
                              <p className="text-sm text-slate-500">{formatearFecha(envio.FechaSolicitud)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-slate-700">{envio.Remitente}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-slate-700">{envio.Destinatario}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="4"/>
                              </svg>
                              <span className="text-slate-600 truncate max-w-32">{envio.Origen}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="4"/>
                              </svg>
                              <span className="text-slate-600 truncate max-w-32">{envio.Destino}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(envio.Estado)}`}>
                            {getEstadoIcon(envio.Estado)}
                            <span className="ml-1">{getEstadoLabel(envio.Estado)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {/* ✅ SELECT CON KEY ÚNICA PARA FORZAR RE-RENDER */}
                            <select
                              key={`${envio.id}-${envio.Estado}`} // ✅ Fuerza re-render cuando cambia Estado
                              disabled={actualizando === envio.id}
                              value={envio.Estado}
                              onChange={(ev) => handleStatusChange(envio.id, ev.target.value)}
                              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white min-w-[160px]"
                            >
                              <option value="RECOLECCION_PENDIENTE">Recolección pendiente</option>
                              <option value="RECOGIDO_TRANSPORTADORA">Recogido por transportadora</option>
                              <option value="EN_TRANSPORTE">En transporte</option>
                              <option value="EN_CIUDAD_DESTINO">En ciudad destino</option>
                              <option value="EN_DISTRIBUCION">En distribución</option>
                              <option value="ENTREGADO">Entregado</option>
                              <option value="NO_ENTREGADO">No entregado</option>
                              <option value="REPROGRAMAR">Reprogramar</option>
                              <option value="DEVOLUCION">Devolución</option>
                              <option value="DEVUELTO_ORIGEN">Devuelto al origen</option>
                              <option value="ENVIO_CANCELADO">Envío cancelado</option>
                              <option value="EN_ESPERA_CLIENTE">En espera del cliente</option>
                            </select>
                            {actualizando === envio.id && (
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            <button
                              onClick={() => setEnvioExpandido(envioExpandido === envio.id ? null : envio.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <svg className={`w-4 h-4 transform transition-transform ${envioExpandido === envio.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Fila expandida con detalles adicionales */}
                      {envioExpandido === envio.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Información del Envío
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Payment ID:</span>
                                    <span className="text-slate-800 font-mono">{envio.PaymentId || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Usuario ID:</span>
                                    <span className="text-slate-800">{envio.usuarioId || "N/A"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Fecha de solicitud:</span>
                                    <span className="text-slate-800">{formatearFecha(envio.FechaSolicitud)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Direcciones Completas
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-slate-600 block">Dirección de recogida:</span>
                                    <span className="text-slate-800">{envio.Origen}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 block">Dirección de entrega:</span>
                                    <span className="text-slate-800">{envio.Destino}</span>
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
          <div className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-white hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}