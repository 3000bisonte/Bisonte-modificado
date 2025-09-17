export interface BisonteAuthPlugin {
  googleSignInCCT(): Promise<{ idToken: string; accessToken?: string; email?: string; raw?: any }>
}

declare global {
  interface Window {
    BisonteAuth?: BisonteAuthPlugin;
  }
}

export {};
