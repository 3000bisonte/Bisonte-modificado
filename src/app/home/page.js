"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Home from "@/components/Home";

function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  return <Home />;
}
export default HomePage;
