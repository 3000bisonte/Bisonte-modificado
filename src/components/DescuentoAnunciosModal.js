import React from "react";

export default function DescuentoAnunciosModal({ open, onClose, onPay, onVerOtro }) {
  if (!open) return null;

  // Tamaño real de la imagen: 768x768px
  // Botón "VER OTRO ANUNCIO": left=60px, bottom=40px, width=280px, height=60px aprox
  // Botón "PAGAR": right=60px, bottom=40px, width=280px, height=60px aprox

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="relative"
        style={{
          width: "90vw",
          maxWidth: "384px", // 768/2
          aspectRatio: "1/1",
        }}
      >
        <img
          src="/descuento-anuncios.png"
          alt="Descuento Anuncios"
          className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-orange-400"
          draggable={false}
        />
        {/* Botón VER OTRO ANUNCIO */}
        <button
          onClick={onVerOtro}
          aria-label="Ver otro anuncio"
          className="absolute"
          style={{
            left: "7.8%",    // 60/768
            bottom: "5.2%",  // 40/768
            width: "36.5%",  // 280/768
            height: "7.8%",  // 60/768
            background: "transparent",
            cursor: "pointer",
            outline: "none",
          }}
        />
        {/* Botón PAGAR */}
        <button
          onClick={onPay}
          aria-label="Pagar"
          className="absolute"
          style={{
            right: "7.8%",
            bottom: "5.2%",
            width: "36.5%",
            height: "7.8%",
            background: "transparent",
            cursor: "pointer",
            outline: "none",
          }}
        />
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-orange-200 z-20"
          aria-label="Cerrar"
          style={{ background: "rgba(0,0,0,0.2)", borderRadius: "50%" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}