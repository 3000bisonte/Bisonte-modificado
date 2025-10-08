'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

import CapacitorGoogleAuth from '@/lib/capacitor-google-auth';

import { clearHomeSticky, clearLastActivity } from '../../utils/homeStickyStorage';

import { IconUser, IconHelp, IconLogout, IconChevronDown } from './Icons';

interface ProfileMenuProps {
  userName: string;
  userImage?: string | null;
}

export default function ProfileMenu({ userName, userImage }: ProfileMenuProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menu al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const handleLogout = async () => {
    setShowMenu(false);
    clearHomeSticky();
    clearLastActivity();

    try {
      await CapacitorGoogleAuth.signOut();
    } catch (error) {
      console.warn('ProfileMenu: Error during native Google sign-out', error);
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.warn('ProfileMenu: Failed to call /api/auth/logout', error);
    }

    await signOut({ redirect: false });
    router.push('/');
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de perfil */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all duration-200"
        onClick={toggleMenu}
        aria-label="Abrir menú de perfil"
      >
        {userImage ? (
          <Image
            src={userImage}
            alt={userName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-medium text-gray-800 hidden sm:block">{userName}</span>
        <IconChevronDown />
      </button>

      {/* Menú desplegable */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push('/perfilCard');
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <IconUser />
              <span className="text-sm text-gray-700">Ver Perfil</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                router.push('/ayuda');
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <IconHelp />
              <span className="text-sm text-gray-700">Ayuda</span>
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleLogout}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 transition-colors text-left text-red-600"
            >
              <IconLogout />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
