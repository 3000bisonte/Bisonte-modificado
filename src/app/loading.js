export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#18191A]">
      <div className="flex flex-col items-center">
        {/* Animación: camión de envíos girando */}
        <div className="mb-4 animate-bounce">
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
            <rect x="10" y="25" width="40" height="20" rx="4" fill="#41e0b3" />
            <rect x="50" y="32" width="18" height="13" rx="2" fill="#23272b" />
            <circle cx="22" cy="50" r="6" fill="#23272b" />
            <circle cx="60" cy="50" r="6" fill="#23272b" />
            <rect x="15" y="30" width="20" height="5" rx="2" fill="#fff" opacity="0.7" />
            <rect x="55" y="36" width="6" height="3" rx="1" fill="#fff" opacity="0.7" />
          </svg>
        </div>
        <span className="text-[#41e0b3] text-lg font-semibold animate-pulse">
          Cargando...
        </span>
      </div>
    </div>
  );
}