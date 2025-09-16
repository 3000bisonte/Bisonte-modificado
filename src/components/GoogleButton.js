"use client";

import { signIn } from "next-auth/react";
import { isWebViewRuntime, buildBridgeCallback } from "../lib/ua";
import { requestGoogleIdToken } from "../lib/nativeBridge";

export default function GoogleButton() {
  return (
    <button
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      onClick={async () => {
        const target = '/home';
        if (isWebViewRuntime()) {
          const idToken = await requestGoogleIdToken(12000);
          if (idToken) {
            const bridge = buildBridgeCallback(target);
            const url = new URL(bridge, typeof window !== 'undefined' ? window.location.origin : 'https://www.bisonteapp.com');
            url.searchParams.set('wv', '1');
            await signIn("credentials", { redirect: true, idToken, callbackUrl: url.toString() });
            return;
          }
        }
        const base = isWebViewRuntime() ? buildBridgeCallback(target) : target;
        const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://www.bisonteapp.com');
        if (isWebViewRuntime()) url.searchParams.set('wv', '1');
        signIn("google", { callbackUrl: url.toString() });
      }}
    >
      <svg
        className="w-4 h-4 mr-2"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
      >
        <path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        ></path>
      </svg>
      Sign in with Google
    </button>
  );
}
