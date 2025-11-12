"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import BottomNav from "@/components/BottomNav";

export default function AdminUsuarios() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const ADMIN_EMAILS = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com",
      "bisonteoskar@gmail.com",
      "test@bisonteapp.com",
    ];

    if (status === "loading") {
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      router.push("/");
    } else {
      fetch("/api/usuarios", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Error ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const usuariosData = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
          setUsuarios(usuariosData);
          setLoading(false);
        })
        .catch((error) => {
          console.error("❌ Error cargando usuarios:", error);
          setUsuarios([]);
          setLoading(false);
        });
    }
  }, [session, status, router]);

  // Filtrar usuarios según búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = (
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchSearch;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-b-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-slate-700 font-semibold text-lg">Cargando usuarios...</p>
          <p className="text-slate-500 text-sm">Obteniendo datos del sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Header con gradiente animado */}
        <div className="mb-8 mt-12 sm:mt-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Gestión de Usuarios
                </h1>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">Panel de administración y control de usuarios</p>
              </div>
            </div>

            {/* Buscador */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-slate-700 placeholder-slate-400"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Usuarios</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {usuarios.length}
                  </p>
                  <p className="text-xs text-green-600 mt-2 font-medium">↑ Activos en la plataforma</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Nuevos Hoy</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {usuarios.filter(u => {
                      const fecha = u.creadoEn || u.createdAt;
                      if (!fecha) return false;
                      const date = new Date(fecha);
                      if (isNaN(date.getTime())) return false;
                      const today = new Date().toDateString();
                      return date.toDateString() === today;
                    }).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Registros del día</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Con Email</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {usuarios.filter(u => u.email).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    {Math.round((usuarios.filter(u => u.email).length / usuarios.length) * 100) || 0}% del total
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Ciudades</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    {new Set(usuarios.map(u => u.ciudad).filter(Boolean)).size}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Ubicaciones únicas</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Lista de Usuarios</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Sistema Activo
                </span>
              </div>
            </div>
          </div>
          
          {usuariosFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-slate-700 font-semibold text-xl mb-2">
                {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
              <p className="text-slate-500">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Los usuarios aparecerán aquí cuando se registren"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ciudad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosFiltrados.map((usuario, index) => (
                    <tr key={usuario.id} className="hover:bg-indigo-50/50 transition-all duration-200 group">
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-12 h-12 bg-gradient-to-br ${
                              index % 5 === 0 ? 'from-indigo-500 to-purple-600' :
                              index % 5 === 1 ? 'from-green-500 to-emerald-600' :
                              index % 5 === 2 ? 'from-blue-500 to-cyan-600' :
                              index % 5 === 3 ? 'from-orange-500 to-pink-600' :
                              'from-purple-500 to-pink-600'
                            } rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                              <span className="text-white font-bold text-lg">
                                {usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                              {usuario.nombre || 'Sin nombre'}
                            </p>
                            <p className="text-sm text-slate-500">ID: {usuario.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-slate-700 font-medium">{usuario.email || 'No especificado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-slate-700">{usuario.ciudad || 'No especificada'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-600">
                          {(() => {
                            const fecha = usuario.creadoEn || usuario.createdAt;
                            if (!fecha) return 'Sin fecha';
                            const date = new Date(fecha);
                            if (isNaN(date.getTime())) return 'Fecha inválida';
                            return date.toLocaleDateString('es-CO', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            });
                          })()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}