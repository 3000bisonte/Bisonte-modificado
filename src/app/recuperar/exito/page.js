export default function ExitoRecuperar() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 px-4">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl border-2 border-[#41e0b3]/20 p-8 flex flex-col items-center">
        <h2 className="text-2xl font-extrabold mb-4 text-[#18191A] text-center">¡Cambio de contraseña exitoso!</h2>
        <p className="text-[#41e0b3] text-center mb-6 text-sm">
          Tu contraseña ha sido actualizada correctamente.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-[#41e0b3] text-white rounded-lg font-bold hover:bg-[#2bbd8c] transition"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
}