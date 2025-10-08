"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthErrorPage() {
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Redirige cualquier error de NextAuth al bridge para evitar 404 o loops
    const to = "/home";
    const params = new URLSearchParams(search?.toString() || "");
    const err = params.get("error") || "";
    const msg = params.get("message") || "";
    const dest = new URL(`/auth/bridge`, window.location.origin);
    dest.search = `?to=${encodeURIComponent(to)}${err ? `&error=${encodeURIComponent(err)}` : ''}${msg ? `&message=${encodeURIComponent(msg)}` : ''}`;
    router.replace(dest.toString());
  }, [search, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Procesando error de autenticación…</p>
      </div>
    </div>
  );
}
