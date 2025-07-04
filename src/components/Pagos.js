"use client";
import React, { useEffect, useState } from "react";

const PagarComponent = () => {
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);

  useEffect(() => {
    setCotizador(JSON.parse(localStorage.getItem("formCotizador")));
    setRemitente(JSON.parse(localStorage.getItem("formRemitente")));
    setDestinatario(JSON.parse(localStorage.getItem("formDestinatario")));
  }, []);

  // ...tu lógica de pago...

  return (
    <div>
      <div className="max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Medios de pago</h1>
        <form>
          <div className="flex items-center mb-4">
            <input type="radio" id="tarjetaCredito" name="pago" className="mr-2" />
            <label htmlFor="tarjetaCredito" className="flex-grow">
              Tarjeta de crédito
            </label>
            <span className="text-sm text-gray-500">Cuotas sin interés</span>
          </div>

          <div className="flex items-center mb-4">
            <input type="radio" id="tarjetaDebito" name="pago" className="mr-2" />
            <label htmlFor="tarjetaDebito" className="flex-grow">
              Tarjeta de débito
            </label>
            <span className="text-sm text-gray-500">Pago en el momento</span>
          </div>

          <div className="flex items-center mb-4">
            <input type="radio" id="transferenciaPSE" name="pago" className="mr-2" />
            <label htmlFor="transferenciaPSE" className="flex-grow">
              Transferencia con PSE
            </label>
            <span className="text-sm text-gray-500">Acreditación en el momento</span>
          </div>

          <div className="flex items-center mb-4">
            <input type="radio" id="effecty" name="pago" className="mr-2" />
            <label htmlFor="effecty" className="flex-grow">
              Effecty
            </label>
            <span className="text-sm text-gray-500">Acreditación en el momento</span>
          </div>

          <div className="flex justify-between w-full mt-6">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold"
              // onClick={() => router.push("/resumen")}
            >
              Anterior
            </button>
            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded font-semibold"
            >
              Pagar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PagarComponent;
