"use client";

import { SessionProvider } from "next-auth/react";

import GlobalLoadingScreen from "../components/GlobalLoadingScreen";
import InactivityGuard from "../components/InactivityGuard";
import FormCleanupMonitor from "../components/FormCleanupMonitor";
import { ConfirmModalProvider } from "../context/ConfirmModalContext";
import { NotificationProvider } from "../context/NotificationContext";
import { GlobalLoadingProvider } from "../contexts/GlobalLoadingContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <InactivityGuard />
      <FormCleanupMonitor />
      <GlobalLoadingProvider>
        <NotificationProvider>
          <ConfirmModalProvider>
            {children}
            <GlobalLoadingScreen />
          </ConfirmModalProvider>
        </NotificationProvider>
      </GlobalLoadingProvider>
    </SessionProvider>
  );
}