"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function Resumen() {
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [fecha, setFecha] = useState(formatDate(new Date()));

  // Estado para desplegables
  const [showRemitente, setShowRemitente] = useState(false);
  const [showDestinatario, setShowDestinatario] = useState(false);

  const router = useRouter();

  // Actualiza la fecha en tiempo real (cada minuto)
  useEffect(() => {
    const interval = setInterval(() => {
      setFecha(formatDate(new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCotizador(JSON.parse(localStorage.getItem("formCotizador")));
    setRemitente(JSON.parse(localStorage.getItem("formRemitente")));
    setDestinatario(JSON.parse(localStorage.getItem("formDestinatario")));
  }, []);

  if (!cotizador || !remitente || !destinatario) {
    return (
      <div className="p-4 text-center text-red-600">
        Faltan datos para mostrar el resumen. Por favor completa todos los formularios.
      </div>
    );
  }

  // Utilidades para mostrar nombres de ciudades si tienes un catálogo
  const ciudades = {
    "11001": "Bogotá D.C.",
    "25001": "Funza",
    "25019": "Mosquera",
    "25040": "Madrid",
    "25148": "Cota",
    "25175": "Chía",
    "25183": "Cajicá",
    "25189": "La Calera",
    "25785": "Tabio",
    "25740": "Soacha",
    "25743": "Sibaté",
    // ...agrega más si es necesario
  };

  const handlePagar = () => {
    router.push("/mercadopago");
  };

  const handleVerAnuncios = () => {
    if (window.AndroidInterface && window.AndroidInterface.showRewardedAd) {
      window.AndroidInterface.showRewardedAd();
    } else {
      alert("Esta función solo está disponible en la app móvil.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-4">
      <div className="w-full max-w-md bg-black rounded-lg shadow-lg p-0">
        <div className="bg-teal-400 text-white text-center py-3 rounded-t-lg font-semibold text-lg">
          Realizar una cotización
        </div>
        <div className="p-4">
             <div className="text-white text-center font-semibold mb-2">
            Lista de envíos a cotizar
          </div>
          {/* Accordion Remitente */}
          <div className="mb-2">
            <button
              className="w-full flex justify-between items-center bg-white px-4 py-2 rounded-t-md border border-gray-200 font-semibold focus:outline-none"
              onClick={() => setShowRemitente((v) => !v)}
              aria-expanded={showRemitente}
              aria-controls="remitente-content"
            >
              <span>Datos del Remitente</span>
              <span className="text-xl">{showRemitente ? "▲" : "▼"}</span>
            </button>
            {showRemitente && (
              <div
                id="remitente-content"
                className="bg-white border-x border-b border-gray-200 rounded-b-md px-4 py-2"
              >
                <div><span className="font-semibold">Nombre:</span> {remitente.nombre}</div>
                <div><span className="font-semibold">Documento:</span> {remitente.tipoDocumento} {remitente.numeroDocumento}</div>
                <div><span className="font-semibold">Celular:</span> {remitente.celular}</div>
                <div><span className="font-semibold">Correo:</span> {remitente.correo}</div>
                <div><span className="font-semibold">Dirección:</span> {remitente.direccionRecogida}</div>
                {remitente.detalleDireccion && (
                  <div><span className="font-semibold">Detalle dirección:</span> {remitente.detalleDireccion}</div>
                )}
                {remitente.recomendaciones && (
                  <div><span className="font-semibold">Recomendaciones:</span> {remitente.recomendaciones}</div>
                )}
              </div>
            )}
          </div>

          {/* Accordion Destinatario */}
          <div className="mb-4">
            <button
              className="w-full flex justify-between items-center bg-white px-4 py-2 rounded-t-md border border-gray-200 font-semibold focus:outline-none"
              onClick={() => setShowDestinatario((v) => !v)}
              aria-expanded={showDestinatario}
              aria-controls="destinatario-content"
            >
              <span>Datos del Destinatario</span>
              <span className="text-xl">{showDestinatario ? "▲" : "▼"}</span>
            </button>
            {showDestinatario && (
              <div
                id="destinatario-content"
                className="bg-white border-x border-b border-gray-200 rounded-b-md px-4 py-2"
              >
                <div><span className="font-semibold">Nombre:</span> {destinatario.nombre}</div>
                <div><span className="font-semibold">Documento:</span> {destinatario.tipoDocumento} {destinatario.numeroDocumento}</div>
                <div><span className="font-semibold">Celular:</span> {destinatario.celular}</div>
                <div><span className="font-semibold">Correo:</span> {destinatario.correo}</div>
                <div><span className="font-semibold">Dirección:</span> {destinatario.direccionEntrega}</div>
                {destinatario.detalleDireccion && (
                  <div><span className="font-semibold">Detalle dirección:</span> {destinatario.detalleDireccion}</div>
                )}
                {destinatario.recomendaciones && (
                  <div><span className="font-semibold">Recomendaciones:</span> {destinatario.recomendaciones}</div>
                )}
              </div>
            )}
          </div>

          {/* Elementos a enviar */}
         
          <div className="bg-blue-400 text-white rounded-t-md px-4 py-2 flex items-center justify-between">
            <span className="font-semibold">Elementos a enviar</span>
            <span className="text-xl"></span>
          </div>
          <div className="bg-white rounded-b-md p-4 mb-4 border border-gray-200">
            <div className="mb-2">
              <span className="font-semibold">Destino:</span>{" "}
              <span className="font-bold">
                Bogotá - {ciudades[cotizador.ciudadDestino] || cotizador.ciudadDestino}
              </span>
            </div>
            <div className="flex items-center mb-2">
              <span className="mr-2">🚚</span>
              <span>
                Peso: <span className="font-bold">{cotizador.peso} KG</span>
                <br />
                Valor declarado: <span className="font-bold">${Number(cotizador.valorDeclarado).toLocaleString("es-CO")}</span>
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📦</span>
              <span>
                Largo: <span className="font-bold">{cotizador.largo} cm</span>
                <br />
                Ancho: <span className="font-bold">{cotizador.ancho} cm</span>
                <br />
                Alto: <span className="font-bold">{cotizador.alto} cm</span>
              </span>
            </div>
            <div className="mt-2">
              <span className="font-semibold">Contenido:</span>{" "}
              <span>{cotizador.recomendaciones}</span>
            </div>
          </div>

          {/* Resumen de envío */}
          <div className="bg-white rounded-md p-4 mb-4 border border-gray-200">
            <div className="text-center font-semibold mb-2">Resumen de tu envío</div>
            <div className="flex justify-between mb-2">
              <span>Tipo de envío</span>
              <span className="font-bold">{cotizador.tipoEnvio || "Paquetes"}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Fecha de envío</span>
              <span className="font-bold">{fecha}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Despacho</span>
              <span className="font-bold">Se recoge en ubicación</span>
            </div>
            <hr className="my-2" />
            <div className="flex flex-col items-start">
              <div className="flex items-center mb-2">
                <span className="h-4 w-4 rounded-full bg-green-400 inline-block mr-2"></span>
                <span>
                  <span className="font-semibold">Origen:</span> Bogotá
                </span>
              </div>
              <div className="flex items-center">
                <span className="h-4 w-4 rounded-full bg-blue-400 inline-block mr-2"></span>
                <span>
                  <span className="font-semibold">Destino:</span>{" "}
                  {ciudades[cotizador.ciudadDestino] || cotizador.ciudadDestino}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600"
              onClick={handlePagar}
              type="button"
            >
              Pagar
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-blue-200 text-blue-700 font-semibold hover:bg-blue-300"
              onClick={handleVerAnuncios}
              type="button"
            >
              Reducir costo viendo anuncios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}