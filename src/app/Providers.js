"use client";

import { SessionProvider } from "next-auth/react";
import InactivityGuard from "../components/InactivityGuard";
import { NotificationProvider } from "../context/NotificationContext";
import { ConfirmModalProvider } from "../context/ConfirmModalContext";

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