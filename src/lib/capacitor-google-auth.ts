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

      const result = await FirebaseAuthentication.signInWithGoogle({
        // You can configure scopes here if needed
        // scopes: ['email', 'profile']
      });

      if (result.user) {
        // Get the ID token for NextAuth verification
        const credential = await FirebaseAuthentication.getCurrentUser();
        const idToken = await FirebaseAuthentication.getIdToken();

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
      if (!this.isCapacitor()) {
        return false;
      }

      await FirebaseAuthentication.signOut();
      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
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