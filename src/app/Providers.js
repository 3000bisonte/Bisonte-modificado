"use client";

import { SessionProvider } from "next-auth/react";

import InactivityGuard from "../components/InactivityGuard";
import { ConfirmModalProvider } from "../context/ConfirmModalContext";
import { NotificationProvider } from "../context/NotificationContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <InactivityGuard />
      <NotificationProvider>
        <ConfirmModalProvider>
          {children}
        </ConfirmModalProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}