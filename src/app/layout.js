//import { Inter } from "next/font/google";
import "./globals.css";
//import { ProviderWrapper } from "@/components/ProviderWrapper";
import { Providers } from "./Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "../components/BottomNav";
//const inter = Inter({ subsets: ["latin"] });

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
      <body>
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
