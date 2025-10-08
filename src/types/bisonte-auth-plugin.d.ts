export interface BisonteAuthPlugin {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  googleSignInCCT(): Promise<{ idToken: string; accessToken?: string; email?: string; raw?: any }>
}

declare global {
  interface Window {
    BisonteAuth?: BisonteAuthPlugin;
  }
}

export {};
