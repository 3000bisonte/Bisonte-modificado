export interface BisonteAuthPlugin {
  googleSignInCCT(): Promise<{ idToken: string; accessToken?: string }>
}

declare global {
  interface Window {
    BisonteAuth?: BisonteAuthPlugin;
  }
}
