import "./globals.css";
import { Providers } from "./Providers";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import ConnectionHandler from "../components/ConnectionHandler";
import CapacitorPluginInit from "../components/CapacitorPluginInit";

// Force dynamic rendering for all routes to avoid static prerender errors
// when client hooks like usePathname/useRouter are used in shared components
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "BisonteApp - Logística",
  description: "Aplicación de gestión logística integral",
  manifest: "/manifest.json",
  icons: {
    icon: "/LogoNew.jpg",
    apple: "/LogoNew.jpg",
    shortcut: "/LogoNew.jpg",
  },
  themeColor: "#41e0b3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <CapacitorPluginInit />
          <ServiceWorkerRegister />
          <ConnectionHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}