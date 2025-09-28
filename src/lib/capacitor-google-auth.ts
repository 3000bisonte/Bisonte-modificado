// Capacitor Google Authentication integration
// Uses @capacitor-firebase/authentication (compatible with Capacitor v7)

import type { CapacitorGlobal } from '@capacitor/core';

// Dynamic import to avoid server-side bundling issues
let FirebaseAuthentication: any = null;

// Only import on client side
if (typeof window !== 'undefined') {
  try {
    import('@capacitor-firebase/authentication').then((module) => {
      FirebaseAuthentication = module.FirebaseAuthentication;
    }).catch(() => {
      // Ignore import errors in web environment
    });
  } catch {
    // Ignore import errors
  }
}

export interface GoogleAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    name: string;
    picture: string;
    idToken: string;
  };
  error?: string;
}

interface CapacitorWindow extends Window {
  Capacitor?: (CapacitorGlobal & {
    Plugins?: {
      FirebaseAuthentication?: any;
      firebaseAuthentication?: any;
    };
  }) | null;
  FirebaseAuthentication?: any;
  firebaseAuthentication?: any;
}

export class CapacitorGoogleAuth {
  /**
   * Small helper to delay execution, giving native plugins time to finish asynchronous work
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Clears any stored auth/session data from browser storage to avoid silent re-login
   * This ensures that the next login will show account selection dialog
   */
  static clearStoredSessionData(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKeys = [
      // Bisonte specific
      'bisonte_mobile_session',
      'google_auth_data',
      'google_auth_code', 
      'google_auth_success',
      'session_data',
      'authToken',
      'refreshToken',
      'google_id_token',
      'lastUser',
      'user',
      
      // Firebase specific 
      'firebase:authUser',
      'firebase:host',
      'firebase_auth_token',
      'firebaseui::rememberedAccounts',
      'firebaseui::pendingEmailCredential',
      
      // Google Auth specific
      'gapi.auth2.data',
      'google_auth_state',
      'google_signin_data',
      
      // NextAuth related
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      
      // Capacitor related
      'capacitor_session',
      'capacitor_auth_data'
    ];

    storageKeys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error: unknown) {
        console.warn('CapacitorGoogleAuth: Failed to remove localStorage key', key, error);
      }
    });

    // Also clear sessionStorage
    const sessionStorageKeys = [
      'authToken',
      'google_auth_data',
      'firebase:authUser',
      'capacitor_session'
    ];

    sessionStorageKeys.forEach((key) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch (error: unknown) {
        console.warn('CapacitorGoogleAuth: Failed to clear sessionStorage key', key, error);
      }
    });
  }

  /**
   * Ensures the native Google Sign-In client is fully signed out so the account selector shows up again.
   */
  private static async clearNativeGoogleAccount(): Promise<void> {
    if (!this.isCapacitor() || !FirebaseAuthentication) {
      return;
    }

    try {
      await FirebaseAuthentication.signOut();
    } catch (error: unknown) {
      console.warn('CapacitorGoogleAuth: native signOut threw an error (ignored)', error);
    }

    await this.delay(250);
  }
  
  /**
   * Initialize Firebase Authentication
   */
  static initialize(): boolean {
    try {
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sign in with Google
   */
  static async signIn(): Promise<GoogleAuthResult> {
    try {
      // Check if running in Capacitor environment
      if (!this.isCapacitor() || !FirebaseAuthentication) {
        return {
          success: false,
          error: 'Google Auth only available in mobile app'
        };
      }

      await this.clearNativeGoogleAccount();

      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['profile', 'email'],
        // Force account selection to prevent auto-login with previous account
        mode: 'popup'
      });

      if (result.user) {
        // Get the ID token for NextAuth verification
        const idToken = await FirebaseAuthentication.getIdToken({ forceRefresh: true });

        return {
          success: true,
          user: {
            uid: result.user.uid,
            email: result.user.email || '',
            name: result.user.displayName || '',
            picture: result.user.photoUrl || '',
            idToken: idToken?.token || ''
          }
        };
      }

      return {
        success: false,
        error: 'No user data received'
      };

    } catch (error: unknown) {
      console.error('Google sign-in failed:', error);
      return {
        success: false,
        error: this.extractErrorMessage(error, 'Authentication failed')
      };
    }
  }

  /**
   * Sign out completely - clears Firebase auth and forces account selection on next login
   */
  static async signOut(): Promise<boolean> {
    try {
      if (this.isCapacitor() && FirebaseAuthentication) {
        // First attempt: normal sign out
        await this.clearNativeGoogleAccount();

        // Wait for native operations to complete
        await this.delay(500);

        // Verify sign out was successful
        try {
          const currentUser = await FirebaseAuthentication.getCurrentUser();
          if (currentUser?.user) {
            console.warn('CapacitorGoogleAuth: user still present after signOut; forcing complete logout');
            
            // Force complete sign out multiple times if needed
            for (let i = 0; i < 3; i++) {
              await FirebaseAuthentication.signOut();
              await this.delay(300);
              
              const checkUser = await FirebaseAuthentication.getCurrentUser();
              if (!checkUser?.user) {
                break;
              }
            }
          }
        } catch (verificationError: unknown) {
          console.warn('CapacitorGoogleAuth: Unable to verify sign-out state (ignored)', verificationError);
        }

        // Additional cleanup to ensure complete logout
        try {
          // Clear any cached credentials
          await this.delay(200);
        } catch (cleanupError: unknown) {
          console.warn('CapacitorGoogleAuth: Cleanup error (ignored)', cleanupError);
        }
      }

      return true;
    } catch (error: unknown) {
      console.error('Sign out failed:', error);
      return false;
    } finally {
      // Always clear stored session data
      this.clearStoredSessionData();
      
      // Clear additional storage that might cache auth state
      if (typeof window !== 'undefined') {
        try {
          // Clear various auth-related storage
          ['firebase:authUser', 'firebase:host', 'authUser'].forEach(key => {
            window.localStorage.removeItem(key);
            window.sessionStorage.removeItem(key);
          });
        } catch (storageError: unknown) {
          console.warn('CapacitorGoogleAuth: Storage cleanup error (ignored)', storageError);
        }
      }
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<GoogleAuthResult> {
    try {
      if (!this.isCapacitor() || !FirebaseAuthentication) {
        return {
          success: false,
          error: 'Not in Capacitor environment'
        };
      }

      const result = await FirebaseAuthentication.getCurrentUser();
      
      if (result.user) {
        const tokenResult = await FirebaseAuthentication.getIdToken();
        
        return {
          success: true,
          user: {
            uid: result.user.uid,
            email: result.user.email || '',
            name: result.user.displayName || '',
            picture: result.user.photoUrl || '',
            idToken: tokenResult?.token || ''
          }
        };
      }

      return {
        success: false,
        error: 'No authenticated user'
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: this.extractErrorMessage(error, 'Failed to get current user')
      };
    }
  }

  /**
   * Check if running in Capacitor environment
   */
  static isCapacitor(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const capacitorGlobal = (window as CapacitorWindow).Capacitor;
    if (!capacitorGlobal || typeof capacitorGlobal.isNativePlatform !== 'function') {
      return false;
    }

    try {
      return capacitorGlobal.isNativePlatform();
    } catch (error: unknown) {
      console.warn('CapacitorGoogleAuth: isNativePlatform check failed', error);
      return false;
    }
  }

  /**
   * Check if user is signed in
   */
  static async isSignedIn(): Promise<boolean> {
    try {
      const result = await this.getCurrentUser();
      return result.success;
    } catch {
      return false;
    }
  }

  private static extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    return fallback;
  }
}

// Export for use in components
export default CapacitorGoogleAuth;