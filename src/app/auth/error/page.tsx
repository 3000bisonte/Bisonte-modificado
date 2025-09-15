"use client";
import Link from "next/link";

export default function AuthErrorPage({ searchParams }: { searchParams?: { error?: string } }) {
  const code = searchParams?.error || "Unknown";

  const messages: Record<string, string> = {
    AccessDenied: "Acceso denegado. Tu dominio de email no está autorizado.",
    OAuthSignin: "No se pudo iniciar sesión con el proveedor.",
    OAuthCallback: "Error en el callback de OAuth.",
    OAuthAccountNotLinked: "La cuenta ya está vinculada con otro método de inicio de sesión.",
    Configuration: "Error de configuración de autenticación.",
    Verification: "Error de verificación.",
    Default: "Ocurrió un error al iniciar sesión.",
  };

  const message = messages[code] || messages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Error de autenticación</h1>
        <p className="text-gray-300 mb-1">{message}</p>
        <p className="text-gray-500 text-sm mb-6">Código: {code}</p>
        <Link href="/" className="inline-block bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
