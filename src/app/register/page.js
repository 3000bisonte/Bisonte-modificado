"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TemporaryStorage from "@/lib/temporaryStorage";
import { sanitizeName, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import { validatePassword, getStrengthColor, getStrengthMessage } from "@/lib/passwordValidator";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Validaciones
  const validarNombre = (nombre) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim());
  const validarCelular = (cel) => /^\+?\d{7,15}$/.test(cel.trim());
  const validarCiudad = (ciudad) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(ciudad.trim());
  const validarEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validarPassword = (pass) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pass);

  // Estados para validaciones en vivo
  const [nombreError, setNombreError] = useState("");
  const [celularError, setCelularError] = useState("");
  const [ciudadError, setCiudadError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Handlers de validación en vivo
  const handleNombreBlur = () => {
    if (!nombre) {setNombreError("El nombre es obligatorio.");}
    else if (!validarNombre(nombre)) {setNombreError("Solo letras y espacios.");}
    else {setNombreError("");}
  };
  const handleCelularBlur = () => {
    if (!celular) {setCelularError("El celular es obligatorio.");}
    else if (!validarCelular(celular)) {setCelularError("Ejemplo: +573001234567");}
    else {setCelularError("");}
  };
  const handleCiudadBlur = () => {
    if (!ciudad) {setCiudadError("La ciudad es obligatoria.");}
    else if (!validarCiudad(ciudad)) {setCiudadError("Solo letras y espacios.");}
    else {setCiudadError("");}
  };
  const handleEmailBlur = () => {
    if (!email) {setEmailError("El correo es obligatorio.");}
    else if (!validarEmail(email)) {setEmailError("Correo no válido.");}
    else {setEmailError("");}
  };
  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError("La contraseña es obligatoria.");
      setPasswordStrength(null);
    } else {
      const validation = validatePassword(password);
      setPasswordStrength(validation);
      
      if (!validation.isValid && validation.errors.length > 0) {
        setPasswordError(validation.errors[0]);
      } else {
        setPasswordError("");
      }
    }
  };

  // Limpiar errores automáticamente al corregir
  const handleNombreChange = (e) => {
    setNombre(e.target.value);
    if (nombreError) {
      if (e.target.value && validarNombre(e.target.value)) {setNombreError("");}
    }
  };
  const handleCelularChange = (e) => {
    setCelular(e.target.value);
    if (celularError) {
      if (e.target.value && validarCelular(e.target.value)) {setCelularError("");}
    }
  };
  const handleCiudadChange = (e) => {
    setCiudad(e.target.value);
    if (ciudadError) {
      if (e.target.value && validarCiudad(e.target.value)) {setCiudadError("");}
    }
  };
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      if (e.target.value && validarEmail(e.target.value)) {setEmailError("");}
    }
  };
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Validar fortaleza en tiempo real
    if (newPassword.length >= 3) {
      const validation = validatePassword(newPassword);
      setPasswordStrength(validation);
      
      if (!validation.isValid && validation.errors.length > 0) {
        setPasswordError(validation.errors[0]);
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordStrength(null);
      if (passwordError && newPassword.length > 0) {
        setPasswordError("");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg("");

    // Validación final antes de enviar
    if (
      !nombre ||
      !celular ||
      !ciudad ||
      !email ||
      !password
    ) {
      setMsg("Todos los campos son obligatorios.");
      return;
    }
    if (
      nombreError ||
      celularError ||
      ciudadError ||
      emailError ||
      passwordError
    ) {
      setMsg("Por favor corrige los errores antes de continuar.");
      return;
    }
    if (!acepta) {
      setMsg("Debes aceptar los términos y condiciones.");
      return;
    }
    setLoading(true);
    
    // Sanitizar datos antes de enviar
    const sanitizedData = {
      nombre: sanitizeName(nombre),
      celular: sanitizePhone(celular),
      ciudad: sanitizeName(ciudad),
      email: sanitizeEmail(email),
      password: password // No sanitizar password, solo validar
    };
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sanitizedData),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Error en el registro");
        setLoading(false);
      } else {
        console.log("✅ [Registro] Usuario registrado exitosamente:", data);
        setMsg("¡Registro exitoso!");
        
        // Guardar datos temporales con expiración de 5 minutos (sin contraseña)
        TemporaryStorage.set("registrationData", {
          nombre: sanitizeName(nombre),
          email: sanitizeEmail(email)
        }, 5);
        
        // Limpiar formulario
        setNombre("");
        setCelular("");
        setCiudad("");
        setEmail("");
        setPassword("");
        setAcepta(false);
        setLoading(false);
        
        // Navegar a página de éxito (sin timeout automático)
        console.log("🔄 [Registro] Navegando a /registro-exitoso");
        router.push("/registro-exitoso");
      }
    } catch {
      setMsg("Error de conexión.");
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen min-h-screen flex items-center justify-center bg-[#18191A]">
      <form
        onSubmit={handleRegister}
        className="bg-[#18191A] pt-4 pb-6 px-4 sm:p-8 rounded-lg shadow w-full sm:max-w-md flex flex-col gap-4 justify-center"
        style={{ minHeight: "auto" }}
        autoComplete="off"
        noValidate
      >
        {/* Botón de regreso al login */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-[#41e0b3] hover:text-white transition-colors self-start mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Volver al inicio de sesión</span>
        </button>

        <div className="mb-2">
          <h2 className="text-white text-lg font-bold mb-1 leading-tight">
            ¡hola!
            <br />
            Bienvenido a Bisonte
          </h2>
          <p className="text-gray-300 text-sm">
            Registrarte es muy fácil y rápido.
          </p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Nombre completo"
            className={`w-full px-3 py-2 rounded mb-1 bg-white text-black focus:outline-none ${nombreError ? "border border-red-500" : ""}`}
            value={nombre}
            onChange={handleNombreChange}
            onBlur={handleNombreBlur}
            autoComplete="off"
          />
          {nombreError && <span className="text-red-400 text-xs">{nombreError}</span>}
        </div>
        <div>
          <input
            type="tel"
            placeholder="+57 Número de celular"
            className={`w-full px-3 py-2 rounded mb-1 bg-white text-black focus:outline-none ${celularError ? "border border-red-500" : ""}`}
            value={celular}
            onChange={handleCelularChange}
            onBlur={handleCelularBlur}
            autoComplete="off"
          />
          {celularError && <span className="text-red-400 text-xs">{celularError}</span>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Ciudad"
            className={`w-full px-3 py-2 rounded mb-1 bg-white text-black focus:outline-none ${ciudadError ? "border border-red-500" : ""}`}
            value={ciudad}
            onChange={handleCiudadChange}
            onBlur={handleCiudadBlur}
            autoComplete="off"
          />
          {ciudadError && <span className="text-red-400 text-xs">{ciudadError}</span>}
        </div>

        <div className="mt-1 mb-1">
          <h3 className="text-white font-bold text-base mb-1">
            Datos para iniciar sesión
          </h3>
        </div>
        <div>
          <input
            type="email"
            placeholder="Correo electrónico"
            className={`w-full px-3 py-2 rounded mb-1 bg-white text-black focus:outline-none ${emailError ? "border border-red-500" : ""}`}
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            autoComplete="off"
          />
          <span className="text-gray-400 text-xs">
            El correo electrónico corresponde al usuario para iniciar sesión
          </span>
          {emailError && <span className="block text-red-400 text-xs">{emailError}</span>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            className={`w-full px-3 py-2 rounded mb-1 bg-white text-black focus:outline-none ${passwordError ? "border border-red-500" : ""}`}
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            autoComplete="new-password"
          />
          
          {/* Indicador de fortaleza de contraseña */}
          {passwordStrength && (
            <div className="mt-2 mb-1">
              <div className="flex gap-1 mb-1">
                <div className={`h-1 flex-1 rounded transition-all ${
                  passwordStrength.strength === 'weak' || passwordStrength.strength === 'invalid' ? 'bg-red-500' :
                  passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
                  passwordStrength.strength === 'good' ? 'bg-blue-500' :
                  passwordStrength.strength === 'strong' ? 'bg-green-500' :
                  'bg-green-600'
                }`} />
                <div className={`h-1 flex-1 rounded transition-all ${
                  passwordStrength.strength === 'fair' || passwordStrength.strength === 'good' || 
                  passwordStrength.strength === 'strong' || passwordStrength.strength === 'very-strong' ? 
                  (passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
                   passwordStrength.strength === 'good' ? 'bg-blue-500' :
                   passwordStrength.strength === 'strong' ? 'bg-green-500' : 'bg-green-600') : 'bg-gray-300'
                }`} />
                <div className={`h-1 flex-1 rounded transition-all ${
                  passwordStrength.strength === 'good' || passwordStrength.strength === 'strong' || 
                  passwordStrength.strength === 'very-strong' ? 
                  (passwordStrength.strength === 'good' ? 'bg-blue-500' :
                   passwordStrength.strength === 'strong' ? 'bg-green-500' : 'bg-green-600') : 'bg-gray-300'
                }`} />
                <div className={`h-1 flex-1 rounded transition-all ${
                  passwordStrength.strength === 'strong' || passwordStrength.strength === 'very-strong' ? 
                  (passwordStrength.strength === 'strong' ? 'bg-green-500' : 'bg-green-600') : 'bg-gray-300'
                }`} />
              </div>
              <p className={`text-xs ${
                passwordStrength.strength === 'weak' || passwordStrength.strength === 'invalid' ? 'text-red-400' :
                passwordStrength.strength === 'fair' ? 'text-yellow-400' :
                passwordStrength.strength === 'good' ? 'text-blue-400' :
                'text-green-400'
              }`}>
                Fortaleza: {getStrengthMessage(passwordStrength.strength)} ({passwordStrength.entropy} bits)
              </p>
              {passwordStrength.warnings.length > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  💡 {passwordStrength.warnings[0]}
                </p>
              )}
            </div>
          )}
          
          <span className="text-gray-400 text-xs">
            Debe tener longitud mínima de 8 caracteres, 1 mayúscula, 1 número y 1
            caracter especial
          </span>
          {passwordError && <span className="block text-red-400 text-xs mt-1">{passwordError}</span>}
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="acepta"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mr-2"
            required
          />
          <label htmlFor="acepta" className="text-gray-300 text-xs">
            Acepto{" "}
            <a
              href="/terminos"
              className="text-[#41e0b3] underline"
            >
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a
              href="/privacidad"
              className="text-[#41e0b3] underline"
            >
              política de privacidad
            </a>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-[#41e0b3] text-white font-bold py-2 rounded mt-2 hover:bg-[#2bbd8c] transition"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
        {msg && (
          <p className="mt-2 text-center text-sm text-[#41e0b3]">{msg}</p>
        )}
        
        {/* Link adicional para volver al login */}
        <p className="text-center text-gray-400 text-sm mt-2">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-[#41e0b3] hover:text-white font-semibold underline transition-colors"
          >
            Inicia sesión aquí
          </button>
        </p>
      </form>
    </div>
  );
}