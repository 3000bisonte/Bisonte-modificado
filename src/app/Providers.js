"use client";
import { SessionProvider } from "next-auth/react";
import { MessagePortProvider } from "../app/context/MessagePortContext";
export function Providers({ children }) {
  return (
    <SessionProvider>
      <MessagePortProvider>{children} </MessagePortProvider>
    </SessionProvider>
  );
}
