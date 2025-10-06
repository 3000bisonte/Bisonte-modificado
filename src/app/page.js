'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

import {
  getLastActivity,
  setLastActivity,
  clearLastActivity,
  INACTIVITY_MIN_MS,
  INACTIVITY_MAX_MS,
} from '../utils/homeStickyStorage';

export default function RootPage() {
  const router = useRouter();
  const { status, data } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (status === 'loading') {
      return;
    }

    const now = Date.now();
    const userId = data?.user?.email ?? data?.user?.id ?? null;
    const { timestamp, path } = getLastActivity();

    if (status !== 'authenticated' || !userId) {
      clearLastActivity();
      router.replace('/login');
      return;
    }

    if (!timestamp) {
      setLastActivity(userId, now, '/home');
      router.replace('/home');
      return;
    }

    const inactivity = now - timestamp;

    if (inactivity > INACTIVITY_MAX_MS) {
      clearLastActivity();
      void signOut({ redirect: false });
      router.replace('/login?session=expired');
      return;
    }

    if (inactivity >= INACTIVITY_MIN_MS) {
      setLastActivity(userId, now, '/home');
      router.replace('/home?resume=1');
      return;
    }

    const target = path && path !== '/' ? path : '/home';
    setLastActivity(userId, now, target);
    router.replace(target);
  }, [status, data, router]);

  // Mostrar loading mientras se resuelve la redirección
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mb-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span style={{ color: '#333', fontSize: 20, fontWeight: 500 }}>Redirigiendo...</span>
    </div>
  );
}