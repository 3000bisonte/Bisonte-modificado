"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function GoogleButtonRegister() {
  const [isLoading, setIsLoading] = useState(false);
  // No necesitamos un estado de error aquí si NextAuth maneja la redirección
  // o si los errores principales se manejan en una página de error global de NextAuth.

  const handleSignIn = async () => {
    setIsLoading(true);
    // No es necesario setErrorMessage("") aquí si el error lo maneja la página de error de NextAuth o el padre.
    try {
      // signIn con redirect: true (comportamiento por defecto si no se especifica redirect)
      // no devuelve una promesa que resuelva aquí si la redirección es exitosa.
      // Simplemente navega. Si hay un error ANTES de la redirección, puede devolver un error.
      const result = await signIn("google", {
        callbackUrl: "/home?showProfileModal=true",
        redirect: true, // Aseguramos que redirija
      });

      // Este código solo se alcanzaría si signIn falla ANTES de redirigir y redirect:true
      // O si redirect:false (que no es nuestro caso aquí)
      if (result && result.error) {
        console.error("Error durante el intento de signIn:", result.error);
        // Aquí podrías notificar al usuario, aunque usualmente NextAuth te redirige a una página de error.
        // Si quisieras manejarlo aquí, necesitarías una forma de pasar el error al padre.
        // Pero con redirect:true, esto es menos común.
        setIsLoading(false); // Detener carga si hay error y no hubo redirección
      }
      // No se necesita setIsLoading(false) si la redirección es exitosa,
      // porque el componente se desmontará.
    } catch (error) {
      // Captura errores de red o problemas inesperados al llamar a signIn
      console.error("Error inesperado al iniciar sesión con Google:", error);
      setIsLoading(false);
      // Aquí podrías pasar un error al componente padre si este componente
      // no se desmonta y necesita mostrar un mensaje.
    }
  };

  return (
    <button
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-70"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        "Procesando..."
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg" // Corregido
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Regístrate con Google {/* O "Continuar con Google" */}
        </>
      )}
    </button>
  );
}