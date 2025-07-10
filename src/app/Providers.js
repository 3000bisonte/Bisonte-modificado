"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/context/NotificationContext";
import { ConfirmModalProvider } from "@/context/ConfirmModalContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <ConfirmModalProvider>
          {children}
        </ConfirmModalProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}