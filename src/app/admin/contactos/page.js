"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

import BottomNav from "@/components/BottomNav";
import ConfirmModal from "@/components/ConfirmModal";
import Notification from "@/components/Notification";
import { useConfirmModal } from "@/context/ConfirmModalContext";
import { useNotification } from "@/context/NotificationContext";

export default function AdminContactos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Estados para notificaciones y modales
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const { showNotification } = useNotification();
  const { showConfirmModal } = useConfirmModal();

  const loadMensajes = useCallback(() => {
    setLoading(true);
    fetch("/api/contacto", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API /api/contacto:", data);
        const mensajesData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setMensajes(mensajesData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading messages:", error);
        setMensajes([]);
        setLoading(false);
        showNotification('❌ Error al cargar mensajes', 'error');
      });
  }, [showNotification]);

  useEffect(() => {
    const ADMIN_EMAILS = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com",
      "bisonteoskar@gmail.com",
      "test@bisonteapp.com",
    ];

    if (status === "loading") {
      return; // No hacer nada mientras la sesión carga
    }

    const userEmail = session?.user?.email;
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      router.push("/"); // Redirigir si no es admin
    } else {
      loadMensajes(); // Cargar mensajes si es admin
    }
  }, [session, status, router, loadMensajes]);

  const handleMarcarLeido = async (id) => {
    try {
      const response = await fetch(`/api/contacto/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'marcar_leido' })
      });

      if (response.ok) {
        // ✅ FUERZA LA ACTUALIZACIÓN
        router.refresh();
        loadMensajes();
        showNotification('✅ Mensaje marcado como leído', 'success');
      } else {
        showNotification('❌ Error al marcar como leído', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al marcar como leído', 'error');
    }
  };

  const handleResponder = async () => {
    if (!respuesta.trim()) {
      showNotification('⚠️ Por favor escribe una respuesta', 'warning');
      return;
    }

    setEnviandoRespuesta(true);
    
    try {
      const response = await fetch(`/api/contacto/${modalRespuesta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'responder',
          respuesta: respuesta
        })
      });

      if (response.ok) {
        // ✅ FUERZA LA ACTUALIZACIÓN
        router.refresh();
        loadMensajes();
        setModalRespuesta(null);
        setRespuesta("");
        showNotification('✅ Respuesta enviada correctamente por email', 'success');
      } else {
        showNotification('❌ Error al enviar respuesta', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al enviar respuesta', 'error');
    }
    
    setEnviandoRespuesta(false);
  };

  const handleArchivar = (id) => {
    const mensaje = mensajes.find(m => m.id === id);
    const accion = mensaje?.archivado ? 'desarchivar' : 'archivar';
    const titulo = mensaje?.archivado ? '📂 Desarchivar mensaje' : '📁 Archivar mensaje';
    const textoConfirm = mensaje?.archivado 
      ? '¿Estás seguro de que quieres desarchivar este mensaje? Volverá a aparecer en la lista principal.' 
      : '¿Estás seguro de que quieres archivar este mensaje? Se ocultará de la vista principal.';

    showConfirmModal({
      title: titulo,
      message: textoConfirm,
      confirmText: accion === 'archivar' ? 'Archivar' : 'Desarchivar',
      cancelText: 'Cancelar',
      type: 'warning',
      onConfirm: () => executeArchivar(id, accion, mensaje?.archivado)
    });
  };

  const executeArchivar = async (id, accion, wasArchived) => {
    try {
      const response = await fetch(`/api/contacto/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: accion,
          archivado: !wasArchived 
        })
      });

      if (response.ok) {
        // ✅ FUERZA LA ACTUALIZACIÓN
        router.refresh();
        loadMensajes();
        const textoNotification = wasArchived ? '📂 Mensaje desarchivado exitosamente' : '📁 Mensaje archivado exitosamente';
        showNotification(textoNotification, 'success');
      } else {
        showNotification('❌ Error al procesar la acción', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al procesar la acción', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {return "Sin fecha";}
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) {return "";}
    if (text.length <= maxLength) {return text;}
    return text.substring(0, maxLength) + "...";
  };

  const getPriorityColor = (email) => {
    if (email?.includes("@gmail.com")) {return "bg-blue-100 text-blue-800";}
    if (email?.includes("@hotmail.com")) {return "bg-purple-100 text-purple-800";}
    if (email?.includes("@yahoo.com")) {return "bg-yellow-100 text-yellow-800";}
    return "bg-gray-100 text-gray-800";
  };

  // Filtrar mensajes
  const mensajesFiltrados = mensajes.filter(mensaje => {
    const matchSearch = (
      mensaje.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.mensaje?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mensaje.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchStatus = filterStatus === "all" || 
      (filterStatus === "nuevo" && !mensaje.leido && !mensaje.respondido) ||
      (filterStatus === "leido" && mensaje.leido && !mensaje.respondido) ||
      (filterStatus === "respondido" && mensaje.respondido) ||
      (filterStatus === "archivado" && mensaje.archivado);
    return matchSearch && matchStatus;
  });

  const getMessageStats = () => {
    const total = mensajesFiltrados.length;
    const recent = mensajesFiltrados.filter(m => {
      if (!m.creadoEn) {return false;}
      const messageDate = new Date(m.creadoEn);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return messageDate > dayAgo;
    }).length;
    
    return { total, recent };
  };

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4 pb-24">
          <div className="flex flex-col items-center space-y-5">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-pink-200 border-b-pink-600 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold text-lg mb-1">Cargando mensajes...</p>
              <p className="text-slate-500 text-sm">Preparando centro de comunicación</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const stats = getMessageStats();

  return (
    <>
      {/* Contenido principal con padding bottom para BottomNav */}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-24">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Mejorado */}
          <div className="mb-6 sm:mb-8 mt-6 sm:mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                    Centro de Mensajes
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">Panel de gestión de comunicaciones</p>
                </div>
              </div>

              {/* Buscador y Filtros */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-2xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo, mensaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-slate-700 placeholder-slate-400 text-sm"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-slate-700 text-sm font-medium cursor-pointer"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="nuevo">🆕 Nuevos</option>
                    <option value="leido">👁️ Leídos</option>
                    <option value="respondido">✅ Respondidos</option>
                    <option value="archivado">📁 Archivados</option>
                  </select>
                  
                  <button
                    onClick={loadMensajes}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Mejoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex items-center space-x-1 text-xs font-semibold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                  <span>Total</span>
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Total Mensajes</p>
                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.total}</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-center space-x-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  <span>{stats.total > 0 ? Math.round((stats.recent / stats.total) * 100) : 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Últimas 24h</p>
                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.recent}</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-blue-100 p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-center space-x-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                  <span>{mensajes.length > 0 ? Math.round((mensajes.filter(m => m.respondido).length / mensajes.length) * 100) : 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Respondidos</p>
                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{mensajes.filter(m => m.respondido).length}</p>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Mensajes de Contacto</h2>
                <button
                  onClick={loadMensajes}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
            
            {mensajesFiltrados.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-semibold text-base sm:text-lg mb-1">
                  {searchTerm || filterStatus !== "all" ? "No se encontraron resultados" : "No hay mensajes de contacto"}
                </p>
                <p className="text-slate-500 text-sm">
                  {searchTerm || filterStatus !== "all" ? "Intenta con otros términos de búsqueda o filtros" : "Los mensajes aparecerán aquí cuando los usuarios contacten"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {mensajesFiltrados.map((mensaje, index) => (
                  <div key={mensaje.id || index} className={`p-4 sm:p-6 hover:bg-slate-50 transition-colors duration-150 ${
                    mensaje.leido ? 'bg-gray-50' : 'bg-white'
                  } ${mensaje.archivado ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        <span className="text-white font-semibold text-lg sm:text-xl">
                          {mensaje.nombre?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 space-y-2 lg:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <h3 className="font-semibold text-slate-800 text-center sm:text-left text-lg">
                              {mensaje.nombre || 'Anónimo'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(mensaje.correo)} text-center sm:text-left inline-block`}>
                              {mensaje.correo || 'Sin email'}
                            </span>
                            {/* Status indicators */}
                            <div className="flex flex-wrap justify-center sm:justify-start space-x-2 gap-y-1">
                              {!mensaje.leido && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                                  🔔 Nuevo
                                </span>
                              )}
                              {mensaje.respondido && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                                  ✅ Respondido
                                </span>
                              )}
                              {mensaje.archivado && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full whitespace-nowrap">
                                  📁 Archivado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-center lg:justify-end space-x-2 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs sm:text-sm">{formatDate(mensaje.creadoEn)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-slate-600 text-sm break-all">{mensaje.correo}</span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-4 sm:p-5 mb-4">
                          <p className="text-slate-700 leading-relaxed text-sm sm:text-base break-words">
                            {expandedMessage === mensaje.id 
                              ? mensaje.mensaje 
                              : truncateText(mensaje.mensaje, 200)
                            }
                          </p>
                          {mensaje.mensaje && mensaje.mensaje.length > 200 && (
                            <button
                              onClick={() => setExpandedMessage(
                                expandedMessage === mensaje.id ? null : mensaje.id
                              )}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-3 block"
                            >
                              {expandedMessage === mensaje.id ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>

                        {/* Mostrar respuesta si existe */}
                        {mensaje.respuesta && (
                          <div className="bg-green-50 border-l-4 border-green-400 p-4 sm:p-5 mb-4 rounded-r-lg">
                            <div className="flex items-center mb-2">
                              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span className="text-sm font-medium text-green-800">
                                📧 Respuesta enviada el {formatDate(mensaje.fechaRespuesta)}
                              </span>
                            </div>
                            <p className="text-green-700 text-sm break-words">{mensaje.respuesta}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div className="text-center sm:text-left">
                            <span className="text-sm font-medium text-gray-600">Tipo Doc:</span>
                            <span className="text-sm text-gray-800 ml-2">{mensaje.tipo_documento || 'N/A'}</span>
                          </div>
                          <div className="text-center sm:text-left">
                            <span className="text-sm font-medium text-gray-600">Núm. Doc:</span>
                            <span className="text-sm text-gray-800 ml-2 break-all">{mensaje.numero_documento || 'N/A'}</span>
                          </div>
                          <div className="text-center sm:text-left">
                            <span className="text-sm font-medium text-gray-600">Celular:</span>
                            <span className="text-sm text-gray-800 ml-2">{mensaje.celular || 'N/A'}</span>
                          </div>
                          <div className="text-center sm:text-left">
                            <span className="text-sm font-medium text-gray-600">Ciudad:</span>
                            <span className="text-sm text-gray-800 ml-2">{mensaje.ciudad || 'N/A'}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <button 
                            onClick={() => setModalRespuesta(mensaje)}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm w-full sm:w-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12v7" />
                            </svg>
                            <span>Responder</span>
                          </button>
                          
                          <button 
                            onClick={() => handleMarcarLeido(mensaje.id)}
                            disabled={mensaje.leido}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm w-full sm:w-auto ${
                              mensaje.leido 
                                ? 'bg-gray-400 text-white cursor-not-allowed' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{mensaje.leido ? 'Leído' : 'Marcar como leído'}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleArchivar(mensaje.id)}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm w-full sm:w-auto ${
                              mensaje.archivado 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-slate-500 text-white hover:bg-slate-600'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span>{mensaje.archivado ? 'Desarchivar' : 'Archivar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para responder */}
      {modalRespuesta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold pr-4">📧 Responder a {modalRespuesta.nombre}</h3>
                <button
                  onClick={() => setModalRespuesta(null)}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">📝 Mensaje original de {modalRespuesta.nombre}:</p>
                <p className="text-gray-800 italic text-sm sm:text-base break-words">&quot;{modalRespuesta.mensaje}&quot;</p>
                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p className="break-all">📧 {modalRespuesta.correo}</p>
                  {modalRespuesta.celular && <p>📱 {modalRespuesta.celular}</p>}
                  {modalRespuesta.ciudad && <p>🏙️ {modalRespuesta.ciudad}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✍️ Tu respuesta:
                </label>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={6}
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setModalRespuesta(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResponder}
                  disabled={enviandoRespuesta}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 order-1 sm:order-2"
                >
                  {enviandoRespuesta ? '📧 Enviando...' : '📧 Enviar Respuesta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
        />
      )}

      {/* Footer - BottomNav */}
      <BottomNav />
    </>
  );
}

