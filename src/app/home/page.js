"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Home from "@/components/Home";

function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email || "";
    const role = session?.user?.role || "";
    const ADMIN_EMAILS = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com",
      "bisonteoskar@gmail.com",
      "test@bisonteapp.com",
    ];

    const isAdmin = role === "admin" || ADMIN_EMAILS.includes(email);
    if (isAdmin) {
      // Enviar a panel admin por defecto
      router.replace("/admin/envios");
    }
  }, [router, session, status]);

  return <Home />;
}
export default HomePage;
