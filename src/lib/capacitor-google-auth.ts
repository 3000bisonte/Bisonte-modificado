// Capacitor Google Authentication integration
// Uses @capacitor-firebase/authentication (compatible with Capacitor v7)

import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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
   */
  static clearStoredSessionData(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKeys = [
      'bisonte_mobile_session',
      'google_auth_data',
      'google_auth_code',
      'google_auth_success',
      'session_data',
      'authToken',
      'refreshToken',
      'google_id_token',
      'lastUser',
      'user'
    ];

    storageKeys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn('CapacitorGoogleAuth: Failed to remove localStorage key', key, error);
      }
    });

    try {
      window.sessionStorage.removeItem('authToken');
    } catch (error) {
      // Ignore sessionStorage issues silently
      console.warn('CapacitorGoogleAuth: Failed to clear sessionStorage authToken', error);
    }
  }

  /**
   * Ensures the native Google Sign-In client is fully signed out so the account selector shows up again.
   */
  private static async clearNativeGoogleAccount(): Promise<void> {
    if (!this.isCapacitor()) {
      return;
    }

    try {
      await FirebaseAuthentication.signOut();
    } catch (error) {
      console.warn('CapacitorGoogleAuth: native signOut threw an error (ignored)', error);
    }

    await this.delay(250);
  }
  
  /**
   * Initialize Firebase Authentication
   */
  static async initialize() {
    try {
      // Configure Firebase if needed
      console.log('Firebase Authentication initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
      return false;
    }
  }

  /**
   * Sign in with Google
   */
  static async signIn(): Promise<GoogleAuthResult> {
    try {
      // Check if running in Capacitor environment
      if (!this.isCapacitor()) {
        return {
          success: false,
          error: 'Google Auth only available in mobile app'
        };
      }

      await this.clearNativeGoogleAccount();

      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['profile', 'email']
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

    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<boolean> {
    try {
      if (this.isCapacitor()) {
        await this.clearNativeGoogleAccount();

        try {
          const currentUser = await FirebaseAuthentication.getCurrentUser();
          if (currentUser?.user) {
            console.warn('CapacitorGoogleAuth: user still present after signOut; retrying once');
            await FirebaseAuthentication.signOut();
            await this.delay(250);
          }
        } catch (verificationError) {
          console.warn('CapacitorGoogleAuth: Unable to verify sign-out state (ignored)', verificationError);
        }
      }

      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    } finally {
      this.clearStoredSessionData();
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<GoogleAuthResult> {
    try {
      if (!this.isCapacitor()) {
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

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get current user'
      };
    }
  }

  /**
   * Check if running in Capacitor environment
   */
  static isCapacitor(): boolean {
    return typeof window !== 'undefined' && 
           !!(window as any).Capacitor &&
           (window as any).Capacitor.isNativePlatform();
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
}

// Export for use in components
export default CapacitorGoogleAuth;