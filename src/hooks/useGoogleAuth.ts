// React hook for Google Authentication in Capacitor
'use client';

import { useState, useEffect } from 'react';
import CapacitorGoogleAuth, { GoogleAuthResult } from '@/lib/capacitor-google-auth';

interface UseGoogleAuthReturn {
  isSignedIn: boolean;
  user: GoogleAuthResult['user'] | null;
  isLoading: boolean;
  signIn: () => Promise<GoogleAuthResult>;
  signOut: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isCapacitor: boolean;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<GoogleAuthResult['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapacitor] = useState(() => CapacitorGoogleAuth.isCapacitor());

  // Initialize and check current user
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isCapacitor) {
        setIsLoading(false);
        return;
      }

      try {
        await CapacitorGoogleAuth.initialize();
        await refreshUser();
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isCapacitor]);

  const refreshUser = async () => {
    if (!isCapacitor) return;

    try {
      const result = await CapacitorGoogleAuth.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
        setIsSignedIn(true);
      } else {
        setUser(null);
        setIsSignedIn(false);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
      setIsSignedIn(false);
    }
  };

  const signIn = async (): Promise<GoogleAuthResult> => {
    if (!isCapacitor) {
      return {
        success: false,
        error: 'Google Auth only available in mobile app'
      };
    }

    setIsLoading(true);
    try {
      const result = await CapacitorGoogleAuth.signIn();
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsSignedIn(true);
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<boolean> => {
    if (!isCapacitor) return false;

    setIsLoading(true);
    try {
      const success = await CapacitorGoogleAuth.signOut();
      
      if (success) {
        setUser(null);
        setIsSignedIn(false);
      }
      
      return success;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSignedIn,
    user,
    isLoading,
    signIn,
    signOut,
    refreshUser,
    isCapacitor
  };
}

export default useGoogleAuth;