import "./globals.css";
import { Providers } from "./Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ConnectionHandler from "@/components/ConnectionHandler";

export const metadata = {
  title: "Bisonte",
  description: "App para logística",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon.png",
  },
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <ServiceWorkerRegister />
          <ConnectionHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}