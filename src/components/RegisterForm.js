"use client";

import { useState } from "react"; // Aún podría ser útil para errores globales
import Link from "next/link";
import GoogleButtonRegister from "@/components/GoogleButtonRegister";
// import { useRouter } from "next/navigation"; // No se necesita para la redirección de signIn

const RegisterForm = () => {
  // El estado isLoading ahora es principalmente interno a GoogleButtonRegister.
  // RegisterForm podría tener su propio isLoading si tuviera otros campos (ej. email/pass)
  // const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Para errores muy genéricos no capturados por NextAuth

  // Ya no necesitas handleGoogleSignIn aquí, ya que GoogleButtonRegister lo maneja.

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-3xl font-semibold text-center text-gray-800">
          Regístrate
        </h2>

        {/* Mensaje de error: Podría mostrarse si signIn falla de forma no estándar */}
        {/* O si hay otros errores de validación del formulario (no aplica aquí) */}
        {errorMessage && (
          <p className="mb-4 text-sm text-center text-red-600 font-bold">
            {errorMessage}
          </p>
        )}

        {/* GoogleButtonRegister ahora maneja su propia lógica de signIn y estado de carga */}
        <GoogleButtonRegister />

        <p className="mt-6 text-sm text-center text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/" className="text-blue-600 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;