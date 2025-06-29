"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const lastUser = localStorage.getItem("lastUser");
    if (lastUser) setEmail(lastUser);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res.error) {
        if (res.error === "No user found") {
          setErrorMessage("No estás registrado, por favor regístrate.");
        } else {
          setErrorMessage("Correo o contraseña incorrectos.");
        }
      } else {
        localStorage.setItem("lastUser", email);
        router.push("/home");
      }
    } catch (error) {
      setErrorMessage("Error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signIn("google", { callbackUrl: "/home" });
      // No necesitas router.push aquí, Google hará la redirección automáticamente
    } catch (error) {
      setErrorMessage("Error con Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen min-h-screen min-w-full flex items-center justify-center bg-[#18191A]">
      <div className="w-full max-w-md bg-[#18191A] rounded-lg shadow-lg px-4 py-8 sm:px-8 sm:py-10 flex flex-col items-center">
        {/* Logo */}
        <img
          src="/bisonte-logo.png"
          alt="Bisonte Logo"
          className="w-20 h-20 sm:w-24 sm:h-24 mb-2 sm:mb-4"
        />
        <h1 className="text-white text-xl sm:text-2xl font-bold mb-6 tracking-wide">
          BISONTE
        </h1>
        {/* Título */}
        <h2 className="text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
          Iniciar Sesión
        </h2>
        {/* Formulario */}
        <form
          className="w-full flex flex-col gap-3 sm:gap-4"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Correo electronico "
            className="rounded-md px-4 py-2 bg-white text-gray-800 focus:outline-none text-sm sm:text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="rounded-md px-4 py-2 bg-white text-gray-800 focus:outline-none text-sm sm:text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded-md mt-1 hover:bg-[#2bbd8c] transition text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
        {/* Error */}
        {errorMessage && (
          <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
        )}
        {/* Olvidaste tu contraseña */}
        <div className="w-full text-left mt-2">
          <a
            href="/recuperar"
            className="text-gray-300 text-xs sm:text-sm hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-2 rounded-md mt-5 hover:bg-gray-100 transition text-sm sm:text-base"
          disabled={isLoading}
        >
          <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
          Sign in With Google
        </button>
        {/* Registro */}
        <div className="w-full text-center mt-6">
          <span className="text-gray-300 text-xs sm:text-sm">¿No tienes cuenta? </span>
          <Link
            href="/register"
            className="text-[#41e0b3] text-xs sm:text-sm font-bold hover:underline"
          >
            Registrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
