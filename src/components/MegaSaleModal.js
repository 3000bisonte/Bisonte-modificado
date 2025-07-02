import React, { useEffect } from "react";

export default function MegaSaleModal({ open, onClose, onPay, onWatchAd }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEsc, false);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] flex items-center justify-center">
        <img
          src="/mega-sale-bg.png"
          alt="Mega Sale"
          className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-yellow-400"
          draggable={false}
        />
        {/* Áreas clickeables invisibles sobre los botones de la imagen */}
        <button
          onClick={onPay}
          aria-label="Pagar"
          className="absolute left-[35px] bottom-[50px] w-[150px] h-[50px] bg-transparent cursor-pointer"
          style={{ outline: "none" }}
        />
        <button
          onClick={onWatchAd}
          aria-label="Ver anuncio"
          className="absolute right-[35px] bottom-[50px] w-[150px] h-[50px] bg-transparent cursor-pointer"
          style={{ outline: "none" }}
        />
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-yellow-200 z-20"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}