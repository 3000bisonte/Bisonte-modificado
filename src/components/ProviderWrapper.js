"use client";

import { MessagePortProvider } from "../app/context/MessagePortContext";

export function ProviderWrapper({ children }) {
  return <MessagePortProvider>{children}</MessagePortProvider>;
}
