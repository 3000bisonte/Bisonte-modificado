"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { useLoadingMonitor } from "../hooks/useLoadingMonitor";
import { validateApiInput, loginSchema } from "../lib/validation";
import {
  clearLastActivity,
  getLastActivity,
  INACTIVITY_MAX_MS,
  INACTIVITY_MIN_MS,
  setLastActivity,
} from "../utils/homeStickyStorage";

import { GoogleAuthButton } from "./GoogleAuthButton";
// NOTE: Do not import server-only modules here (like ../lib/security) because it pulls prisma/env into the client bundle

const LoginForm = ({ callbackUrl }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🎯 Monitorear estado isLoading - activa pantalla global después de 3 segundos
  useLoadingMonitor(isLoading, 'login-form', 'Iniciando sesión...');
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const router = useRouter();
  const { data: session } = useSession();
  // Comprobar inactividad para redirigir según el tiempo transcurrido desde la última actividad
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!session?.user) {
      return;
    }

    const userId = session.user.email ?? session.user.id ?? null;
    const now = Date.now();

    const { timestamp, path } = getLastActivity();

    if (!timestamp) {
      setLastActivity(userId, now, "/home");
      router.replace("/home");
      return;
    }

    const inactivity = now - timestamp;

    if (inactivity > INACTIVITY_MAX_MS) {
      clearLastActivity();
      return;
    }

    if (inactivity >= INACTIVITY_MIN_MS) {
      setLastActivity(userId, now, "/home");
      router.replace("/home?resume=1");
      return;
    }

    const target = path && path !== "/" ? path : "/home";
    setLastActivity(userId, now, target);
    router.replace(target);
  }, [session?.user, router]);

  // 🔍 Real-time validation
  const validateField = useCallback((field, value) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };

      if (field === 'email') {
        const result = loginSchema.shape.email.safeParse(value || '');
        if (!value) {
          newErrors.email = 'Email es requerido';
        } else if (!result.success) {
          newErrors.email = result.error.issues?.[0]?.message || 'Formato de email inválido';
        } else {
          delete newErrors.email;
        }
      }

      if (field === 'password') {
        const result = loginSchema.shape.password.safeParse(value || '');
        if (!value) {
          newErrors.password = 'Contraseña es requerida';
        } else if (!result.success) {
          newErrors.password = result.error.issues?.[0]?.message || 'Contraseña inválida';
        } else {
          delete newErrors.password;
        }
      }

      return newErrors;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastUser = localStorage.getItem("lastUser");
      if (lastUser) {
        setEmail(lastUser);
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setFieldErrors({});
    
    // 📋 Client-side validation before submission
    const validation = validateApiInput(loginSchema, { email, password });
    if (!validation.success) {
      const newErrors = {};
      (validation.error?.details || []).forEach((issue) => {
        const field = issue?.path?.[0] || issue?.field;
        const message = issue.message || "Dato inválido";

        if (field === "email") {
          newErrors.email = message;
        } else if (field === "password") {
          newErrors.password = message;
        }
      });
      setFieldErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
  email: validation.data.email,
  password: validation.data.password,
      });

      if (res?.error) {
        // 🛡️ Enhanced error handling with specific messages
        if (res.error.toLowerCase().includes("rate limit") || 
            res.error.toLowerCase().includes("demasiados intentos")) {
          setErrorMessage(res.error);
        } else if (res.error.toLowerCase().includes("cuenta bloqueada") || 
                   res.error.toLowerCase().includes("locked")) {
          setErrorMessage("Tu cuenta ha sido temporalmente bloqueada por seguridad. Intenta más tarde.");
        } else if (res.error.toLowerCase().includes("no user") ||
                   res.error.toLowerCase().includes("not found")) {
          setErrorMessage(
            "El correo no está registrado. Por favor regístrate o inicia sesión con Google."
          );
        } else if (res.error.toLowerCase().includes("datos inválidos")) {
          setErrorMessage("Por favor verifica que el email y contraseña sean correctos.");
        } else {
          setErrorMessage(
            "Correo o contraseña incorrectos. Si no tienes cuenta, regístrate o usa Google."
          );
        }
        
        setIsLoading(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("passwordRegistro");
        }
        return;
      }

      if (res?.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("lastUser", email);
          localStorage.removeItem("passwordRegistro");
          // 🔄 Clear lastActivity to force fresh home redirect after password reset
          clearLastActivity();
        }
        // ✅ Force hard navigation to ensure redirect after password change
        window.location.href = callbackUrl || "/home";
      } else {
        setErrorMessage("Error al iniciar sesión.");
        if (typeof window !== "undefined") {
          localStorage.removeItem("passwordRegistro");
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage("Error al iniciar sesión.");
      if (typeof window !== "undefined") {
        localStorage.removeItem("passwordRegistro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ADMIN_EMAILS = [
    "3000bisonte@gmail.com",
    "bisonteangela@gmail.com",
    "bisonteoskar@gmail.com",
  ];
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <div className="min-h-screen w-screen max-w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 relative overflow-x-hidden overflow-y-auto">
      {/* Background Pattern - Simplified */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative w-full max-w-md mx-auto z-10">
        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 px-6 py-10 sm:px-10 sm:py-12">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full blur opacity-40"></div>
              <Image
                src="/LogoNew.jpeg"
                alt="Bisonte Logo"
                width={96}
                height={96}
                className="relative h-20 w-20 rounded-full object-cover border-2 border-white/20 shadow-lg sm:h-24 sm:w-24"
                priority
              />
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold mt-4 tracking-wider">
              BISONTE
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-500 mx-auto mt-2"></div>
          </div>

          {/* Welcome Title */}
          <div className="text-center mb-8">
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-2">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Ingresa tus credenciales para continuar
            </p>
            {isAdmin && (
              <p className="mt-2 text-xs font-medium text-amber-300">
                Acceso administrativo detectado. Serás redirigido al panel correspondiente.
              </p>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-6"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-gray-300 text-sm font-medium">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base ${
                    fieldErrors.email 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-teal-400'
                  }`}
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    validateField('email', value);
                  }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
                {fieldErrors.email && (
                  <div id="email-error" className="text-red-400 text-xs mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors.email}
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-gray-300 text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base ${
                    fieldErrors.password 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-teal-400'
                  }`}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    validateField('password', value);
                  }}
                  onBlur={(e) => validateField('password', e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />
                {fieldErrors.password && (
                  <div id="password-error" className="text-red-400 text-xs mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors.password}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-white/5 rounded-r-xl transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M5.636 5.636l14.142 14.142M9.879 9.879L12 12m2.121-2.121l-2.122 2.122" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/recuperar"
                className="text-teal-400 text-sm hover:text-teal-300 transition-colors duration-200 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400">o continúa con</span>
              </div>
            </div>

            {/* Google Button - Using our new GoogleAuthButton component */}
            <div className="w-full">
              <GoogleAuthButton />
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <span className="text-gray-400 text-sm">¿No tienes cuenta? </span>
            <Link
              href="/register"
              className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors duration-200 hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            © 2024 Bisonte Logística. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;