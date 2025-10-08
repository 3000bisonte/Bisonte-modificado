'use client';

import { useState, useEffect } from 'react';

interface AdminStats {
  usuarios: number;
  envios: number;
  mensajes: number;
}

interface StatsPanelProps {
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export default function StatsPanel({ isAdmin, isAuthenticated }: StatsPanelProps) {
  const [stats, setStats] = useState<AdminStats>({ usuarios: 0, envios: 0, mensajes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || !isAuthenticated) {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let cancelled = false;

    const fetchStats = async () => {
      if (cancelled) {
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await res.json();
        if (!cancelled) {
          setStats({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            usuarios: Number(data?.usuarios) || 0,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            envios: Number(data?.envios) || 0,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            mensajes: Number(data?.mensajes) || 0,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Error obteniendo estadísticas admin:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchStats();
    const intervalId = setInterval(() => {
      void fetchStats();
    }, 30000); // Actualizar cada 30 segundos

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const handleFocus = () => fetchStats();
    const handleVisibility = () => {
      if (!document.hidden) {
        void fetchStats();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAdmin, isAuthenticated]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Panel de Administración
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Usuarios Registrados"
          value={stats.usuarios}
          loading={loading}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        
        <StatCard
          title="Envíos Totales"
          value={stats.envios}
          loading={loading}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        
        <StatCard
          title="Mensajes"
          value={stats.mensajes}
          loading={loading}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
}

function StatCard({ title, value, loading, icon }: StatCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-sm font-medium">{title}</span>
        <div className="text-white/60">{icon}</div>
      </div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-16"></div>
        </div>
      ) : (
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
