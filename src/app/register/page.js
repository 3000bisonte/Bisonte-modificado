"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  // Handlers de validación en vivo
  const handleNombreBlur = () => {
    if (!nombre) setNombreError("El nombre es obligatorio.");
    else if (!validarNombre(nombre)) setNombreError("Solo letras y espacios.");
    else setNombreError("");
  };
  const handleCelularBlur = () => {
    if (!celular) setCelularError("El celular es obligatorio.");
    else if (!validarCelular(celular)) setCelularError("Ejemplo: +573001234567");
    else setCelularError("");
  };
  const handleCiudadBlur = () => {
    if (!ciudad) setCiudadError("La ciudad es obligatoria.");
    else if (!validarCiudad(ciudad)) setCiudadError("Solo letras y espacios.");
    else setCiudadError("");
  };
  const handleEmailBlur = () => {
    if (!email) setEmailError("El correo es obligatorio.");
    else if (!validarEmail(email)) setEmailError("Correo no válido.");
    else setEmailError("");
  };
  const handlePasswordBlur = () => {
    if (!password) setPasswordError("La contraseña es obligatoria.");
    else if (!validarPassword(password)) setPasswordError("Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 caracter especial.");
    else setPasswordError("");
  };

  // Limpiar errores automáticamente al corregir
  const handleNombreChange = (e) => {
    setNombre(e.target.value);
    if (nombreError) {
      if (e.target.value && validarNombre(e.target.value)) setNombreError("");
    }
  };
  const handleCelularChange = (e) => {
    setCelular(e.target.value);
    if (celularError) {
      if (e.target.value && validarCelular(e.target.value)) setCelularError("");
    }
  };
  const handleCiudadChange = (e) => {
    setCiudad(e.target.value);
    if (ciudadError) {
      if (e.target.value && validarCiudad(e.target.value)) setCiudadError("");
    }
  };
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      if (e.target.value && validarEmail(e.target.value)) setEmailError("");
    }
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) {
      if (e.target.value && validarPassword(e.target.value)) setPasswordError("");
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
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, celular, ciudad, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Error en el registro");
      } else {
        setMsg("Registro exitoso. Ahora puedes iniciar sesión.");
        setTimeout(() => {
          router.push("/registro-exitoso");
        }, 1500);
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
          <span className="text-gray-400 text-xs">
            Debe tener longitud mínima de 8 caracteres, 1 mayúscula, 1 número y 1
            caracter especial
          </span>
          {passwordError && <span className="block text-red-400 text-xs">{passwordError}</span>}
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
              href="#"
              className="text-[#41e0b3] underline"
            >
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a
              href="#"
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
      </form>
    </div>
  );
}