import React, { useState, useEffect } from "react";

const ConsentModal = ({ onAccept }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false);

  useEffect(() => {
    // Verificar si ya se aceptaron los términos en localStorage
    const consentGiven = localStorage.getItem("consentGiven");
    if (!consentGiven) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    // Guardar en localStorage para recordar la preferencia del usuario
    localStorage.setItem("consentGiven", "true");
    setIsOpen(false);
    onAccept(); // Llamar a la función pasada como prop para proceder
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Aceptación de Términos
            </h2>
            <p className="text-gray-700 mb-4">
              Para solicitar este servicio, debes aceptar nuestros{" "}
              <a
                href="/terminos"
                target="_blank"
                className="text-blue-500 underline"
              >
                Términos de Servicio
              </a>{" "}
              y el{" "}
              <a
                href="/politica-datos"
                target="_blank"
                className="text-blue-500 underline"
              >
                Tratamiento de Datos Personales
              </a>
              .
            </p>

            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
                className="mr-2"
              />
              <label htmlFor="terms" className="text-gray-700">
                Acepto los Términos de Servicio
              </label>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="dataPolicy"
                checked={acceptedDataPolicy}
                onChange={() => setAcceptedDataPolicy(!acceptedDataPolicy)}
                className="mr-2"
              />
              <label htmlFor="dataPolicy" className="text-gray-700">
                Acepto el Tratamiento de Datos Personales
              </label>
            </div>

            <button
              onClick={handleAccept}
              disabled={!acceptedTerms || !acceptedDataPolicy}
              className={`w-full py-2 px-4 rounded text-white font-semibold ${
                acceptedTerms && acceptedDataPolicy
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsentModal;
