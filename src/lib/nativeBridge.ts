"use client";

import type { BisonteAuthPlugin as ContractBisonteAuthPlugin } from "../types/bisonte-auth-plugin";

import { isWebViewRuntime, isCapacitorRuntime, type WebViewBridgeWindow } from "./ua";

export interface IdTokenAuthResult {
  idToken?: string | null;
  token?: string | null;
  accessToken?: string | null;
  authentication?: {
    idToken?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export type IdTokenResult = IdTokenAuthResult | string | null | undefined;

type FirebaseAuthenticationBridge = {
  signInWithGoogle?: () => Promise<unknown>;
};

type GoogleAuthBridge = {
  initialize?: () => Promise<void>;
  signIn?: () => Promise<unknown>;
};

type CapacitorPlugins = {
  BisonteAuth?: ContractBisonteAuthPlugin;
  FirebaseAuthentication?: FirebaseAuthenticationBridge;
  GoogleAuth?: GoogleAuthBridge;
  [key: string]: unknown;
};

export interface CapacitorBridgeWindow extends WebViewBridgeWindow {
  Capacitor?: {
    Plugins?: CapacitorPlugins;
  } | null;
  FirebaseAuthentication?: FirebaseAuthenticationBridge;
  GoogleAuth?: GoogleAuthBridge;
  __BisonteProvideIdToken?: (token: unknown) => void;
}

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const isJwtToken = (token: unknown): token is string => {
  if (typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3 && parts.every((segment) => segment.length > 0);
};

const isTokenShape = (candidate: unknown): candidate is IdTokenAuthResult => {
  if (candidate === null || typeof candidate !== "object") {
    return false;
  }

  return true;
};

const extractToken = (candidate: unknown): string | null => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    return isJwtToken(candidate) ? candidate : null;
  }

  if (!isTokenShape(candidate)) {
    return null;
  }

  const maybeAuth = candidate.authentication;
  const directToken =
    asString(candidate.idToken) ??
    asString(candidate.token) ??
    asString(candidate.accessToken) ??
    (maybeAuth && typeof maybeAuth === "object" ? asString((maybeAuth as IdTokenAuthResult).idToken) : null);

  return isJwtToken(directToken) ? directToken : null;
};

export async function requestGoogleIdToken(timeoutMs = 12000): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (!isWebViewRuntime()) {
    return null;
  }

  try {
    if (isCapacitorRuntime()) {
      const w = window as unknown as CapacitorBridgeWindow;

      const bisonteAuth = w.Capacitor?.Plugins?.BisonteAuth ?? w.BisonteAuth;
      if (bisonteAuth && typeof bisonteAuth.googleSignInCCT === "function") {
        try {
          const res = await bisonteAuth.googleSignInCCT();
          const token = extractToken(res);
          if (token) {
            return token;
          }
        } catch (error) {
          console.warn("nativeBridge: googleSignInCCT failed", error);
        }
      }

      const firebaseAuth = w.Capacitor?.Plugins?.FirebaseAuthentication ?? w.FirebaseAuthentication;
      if (firebaseAuth && typeof firebaseAuth.signInWithGoogle === "function") {
        const res = await firebaseAuth.signInWithGoogle();
        const token = extractToken(res);
        if (token) {
          return token;
        }
      }

      const googleAuth = w.Capacitor?.Plugins?.GoogleAuth ?? w.GoogleAuth;
      if (googleAuth && typeof googleAuth.signIn === "function") {
        try {
          if (typeof googleAuth.initialize === "function") {
            await googleAuth.initialize();
          }
        } catch (error) {
          console.warn("nativeBridge: GoogleAuth initialize failed", error);
        }

        const res = await googleAuth.signIn();
        const token = extractToken(res);
        if (token) {
          return token;
        }
      }
    }
  } catch (error) {
    console.warn("nativeBridge: capacitor token retrieval failed", error);
  }

  return await new Promise<string | null>((resolve) => {
    let settled = false;
    const timerId = window.setTimeout(() => finish(null), timeoutMs);

    const cleanup = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener("message", onMessage);
      try {
        delete (window as unknown as CapacitorBridgeWindow).__BisonteProvideIdToken;
      } catch (error) {
        console.warn("nativeBridge: failed cleaning bridge callback", error);
      }
      clearTimeout(timerId);
    };

    const finish = (token: unknown) => {
      if (settled) {
        return;
      }
      cleanup();
      resolve(isJwtToken(token) ? token : null);
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      try {
        const { data } = event;
        if (!data) {
          return;
        }

        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data) as unknown;
            const token = extractToken(parsed);
            if (token) {
              finish(token);
              return;
            }
            if (isJwtToken(data)) {
              finish(data);
              return;
            }
          } catch (error) {
            if (isJwtToken(data)) {
              finish(data);
              return;
            }
            console.warn("nativeBridge: malformed message payload", error);
          }
          return;
        }

        if (typeof data === "object") {
          const token = extractToken(data);
          if (token) {
            const type = (data as Record<string, unknown>).type;
            if (!type || type === "ID_TOKEN" || type === "idToken") {
              finish(token);
            }
          }
        }
      } catch (error) {
        console.warn("nativeBridge: error parsing host message", error);
      }
    };

    window.addEventListener("message", onMessage);

    try {
      (window as unknown as CapacitorBridgeWindow).__BisonteProvideIdToken = (token: unknown) => finish(token);
    } catch (error) {
      console.warn("nativeBridge: failed to expose host callback", error);
    }

    try {
      (window as unknown as CapacitorBridgeWindow).ReactNativeWebView?.postMessage?.(
        JSON.stringify({ type: "REQUEST_ID_TOKEN" })
      );
    } catch (error) {
      console.warn("nativeBridge: ReactNativeWebView postMessage failed", error);
    }

    try {
      (window as unknown as CapacitorBridgeWindow).webkit?.messageHandlers?.bridge?.postMessage?.({
        type: "REQUEST_ID_TOKEN",
      });
    } catch (error) {
      console.warn("nativeBridge: webkit bridge postMessage failed", error);
    }

    try {
      window.parent?.postMessage({ type: "REQUEST_ID_TOKEN" }, "*");
    } catch (error) {
      console.warn("nativeBridge: parent postMessage failed", error);
    }

  });
}
