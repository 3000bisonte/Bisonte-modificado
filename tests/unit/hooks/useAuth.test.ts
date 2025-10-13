/**
 * Unit Tests - useAuth Hook
 * 
 * Prueba la lógica de autenticación y roles
 */

import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useAuth } from '../../../src/hooks/useAuth';

// Mock de los hooks de Next.js
jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Hook: useAuth', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    } as any);
  });

  it('debe retornar estado de loading cuando la sesión está cargando', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('debe retornar datos de usuario cuando está autenticado', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userName).toBe('Test User');
    expect(result.current.userEmail).toBe('test@example.com');
    expect(result.current.userImage).toBe('https://example.com/avatar.jpg');
  });

  it('debe extraer nombre del email si no hay nombre disponible', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'juan.perez@example.com',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.userName).toBe('juan.perez');
  });

  it('debe retornar "Usuario" como nombre por defecto si no hay datos', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {},
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.userName).toBe('Usuario');
  });

  it('debe identificar correctamente a un administrador', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: '3000bisonte@gmail.com',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAdmin).toBe(true);
  });

  it('debe identificar que un usuario normal no es administrador', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'usuario.normal@example.com',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAdmin).toBe(false);
  });

  it('debe retornar userId del email si está disponible', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.userId).toBe('test@example.com');
  });

  it('debe retornar null como userId si no está autenticado', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.userId).toBeNull();
  });

  it('debe verificar todos los emails de administrador', () => {
    const adminEmails = [
      '3000bisonte@gmail.com',
      'bisonteangela@gmail.com',
      'bisonteoskar@gmail.com',
    ];

    adminEmails.forEach((email) => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isAdmin).toBe(true);
    });
  });
});
