'use client';

import React from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

/**
 * Google Auth Button Component for Capacitor
 * Shows different UI based on platform (web vs mobile)
 */
export function GoogleAuthButton() {
  const { 
    isSignedIn, 
    user, 
    isLoading, 
    signIn, 
    signOut, 
    isCapacitor 
  } = useGoogleAuth();

  const handleSignIn = async () => {
    console.log('GoogleAuthButton: Starting sign-in process...');
    
    try {
      const result = await signIn();
      console.log('GoogleAuthButton: Sign-in result:', result);
      
      if (result.success && result.user) {
        console.log('GoogleAuthButton: User authenticated, sending to backend...');
        
        // Test the backend endpoint first
        try {
          console.log('GoogleAuthButton: Testing backend connection...');
          const testResponse = await fetch('/api/test-google-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              test: true,
              timestamp: new Date().toISOString()
            }),
          });
          
          const testData = await testResponse.json();
          console.log('GoogleAuthButton: Test response:', testData);
        } catch (testError) {
          console.error('GoogleAuthButton: Test endpoint failed:', testError);
        }

        // Send the authentication data to your backend
        try {
          console.log('GoogleAuthButton: Sending auth data to backend...');
          const response = await fetch('/api/auth/capacitor-google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: result.user.idToken,
              user: result.user
            }),
          });

          console.log('GoogleAuthButton: Backend response status:', response.status);
          const data = await response.json();
          console.log('GoogleAuthButton: Backend response data:', data);
          
          if (data.success) {
            console.log('Backend authentication successful:', data);
            
            // Wait a bit for cookie to be set
            setTimeout(() => {
              // Redirect to home or dashboard
              if (data.redirectUrl) {
                console.log('GoogleAuthButton: Redirecting to:', data.redirectUrl);
                window.location.href = data.redirectUrl;
              } else {
                console.log('GoogleAuthButton: Redirecting to /home');
                window.location.href = '/home';
              }
            }, 1000);
          } else {
            console.error('Backend authentication failed:', data.error);
            alert('Authentication failed: ' + data.error);
          }
        } catch (error) {
          console.error('Failed to authenticate with backend:', error);
          alert('Network error during authentication: ' + error.message);
        }
      } else {
        console.error('Google sign-in failed:', result.error);
        alert('Google sign-in failed: ' + result.error);
      }
    } catch (error) {
      console.error('GoogleAuthButton: Unexpected error:', error);
      alert('Unexpected error: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      console.log('Signed out successfully');
      // You might want to also sign out from your backend session
    }
  };

  // Show different UI for web vs mobile
  if (!isCapacitor) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Google Authentication is only available in the mobile app.
        </p>
        <p className="text-sm text-yellow-600 mt-2">
          Use the regular login form on web, or install the mobile app.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <button 
        disabled 
        className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center"
      >
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </button>
    );
  }

  if (isSignedIn && user) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div className="flex-1">
            <p className="text-green-800 font-medium">{user.name}</p>
            <p className="text-green-600 text-sm">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium py-3 px-4 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm sm:text-base"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Continuar con Google</span>
    </button>
  );
}

export default GoogleAuthButton;