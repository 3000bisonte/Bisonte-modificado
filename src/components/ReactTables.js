"use client"; // Necesario si usas hooks como useState, useEffect

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import Link from 'next/link'; // Importar Link

function TanstackReactTable({ data, columns }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // Datos del destinatario
  const [isLoading, setIsLoading] = useState(false); // Indicador de carga
  const [errorMessage, setErrorMessage] = useState(""); // Mensajes de error

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    // Opcional: Puedes añadir un tamaño de página por defecto
    // initialState: { pagination: { pageSize: 10 } },
  });

  const handleRowClick = async (rowData) => {
    // Validar que rowData exista y tenga la propiedad DestinatarioId
    if (!rowData?.DestinatarioId) {
      console.warn("Fila sin DestinatarioId clickeada:", rowData);
      setErrorMessage("No se pudo obtener la información detallada para esta fila.");
      // Abrir el modal para mostrar el error si se desea
      setSelectedRecipient(null); // Asegurarse de limpiar datos previos
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(""); // Limpiar errores previos al iniciar carga
    setSelectedRecipient(null); // Limpiar destinatario previo
    setIsModalOpen(true); // Abrir modal para mostrar loader

    try {
      const response = await fetch(
        `/api/destinatario/obtenerxid/${rowData.DestinatarioId}`, // Usar DestinatarioId
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido del servidor'); // Intentar leer cuerpo
        console.error(`Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status} al obtener datos del destinatario.`);
      }

      const recipientData = await response.json();
      if (!recipientData || Object.keys(recipientData).length === 0) { // Validar si la respuesta vino vacía o es un objeto vacío
        throw new Error("No se encontraron datos para el destinatario seleccionado.");
      }
      setSelectedRecipient(recipientData); // Guardar datos obtenidos
      // El modal ya está abierto, el loader se quitará automáticamente al final
    } catch (error) {
      console.error("Error al cargar el destinatario:", error);
      setErrorMessage(error.message || "Hubo un problema al cargar los datos.");
      // Mantener el modal abierto para mostrar el error
    } finally {
      setIsLoading(false); // Quitar loader independientemente del resultado
    }
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecipient(null);
    setErrorMessage(""); // Limpiar error al cerrar
  };

  return (
    // Ajustado mt-20 para dar más espacio si tienes una navbar fija
    <div className="container mx-auto my-4 mt-20 py-1 sm:px-6 lg:px-8">

      {/* Contenedor para Título y Botón Home */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3"> {/* Añadido gap para espacio */}
        <h1 className="text-2xl font-bold text-gray-800 text-center sm:text-left"> {/* Centrado en móvil, izquierda en pantallas mayores */}
          Historial de envíos
        </h1>
        {/* Botón/Link para ir a Inicio */}
        <Link href="/home" legacyBehavior>
          <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-teal-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-150 ease-in-out w-full sm:w-auto"> {/* Ancho completo en móvil */}
             Ir a Inicio
          </a>
        </Link>
      </div>

      {/* Buscador */}
      <div className="py-1 mb-4">
        <input
          type="text"
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          placeholder="Buscar en historial (por cualquier campo)..." // Placeholder más descriptivo
          className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto shadow rounded-lg border border-gray-200"> {/* Borde añadido */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col" // Mejor para accesibilidad
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                    // Solo permitir ordenamiento si la columna no es de acciones
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }} // Cambiar cursor si se puede ordenar
                  >
                    <div className="flex items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && ( // Mostrar icono solo si se puede ordenar
                        <span className="ml-1 text-gray-400"> {/* Color más suave */}
                          {
                            { asc: "🔼", desc: "🔽" }[
                              header.column.getIsSorted() ?? null
                            ]
                          }
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
             {table.getRowModel().rows.length === 0 ? (
               <tr>
                 <td
                   colSpan={columns.length} // Asegurar que colSpan use el número correcto de columnas
                   className="px-4 py-10 text-center text-gray-500 text-sm" // Más padding vertical
                 >
                   {filtering ? 'No se encontraron envíos con ese filtro.' : 'No hay envíos registrados aún.'}
                 </td>
               </tr>
             ) : (
                table.getRowModel().rows.map((row) => ( // No necesitas el index aquí
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out" // Transición suave
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap" // Ajustado color y padding
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
             )}
          </tbody>
        </table>
      </div>

       {/* Modal */}
       {isModalOpen && (
         <div
           className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 px-4 transition-opacity duration-300"
           onClick={closeModal} // Cerrar al hacer clic fuera
           aria-labelledby="modal-title"
           role="dialog"
           aria-modal="true"
         >
           <div
             className="modal-container bg-white rounded-lg p-6 shadow-xl relative w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-modal-appear"
             onClick={(e) => e.stopPropagation()} // Evitar cierre al hacer clic dentro
           >
             <button
               onClick={closeModal}
               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100" // Estilo mejorado del botón cerrar
               aria-label="Cerrar modal"
             >
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
             <h2 id="modal-title" className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2"> {/* Título con borde inferior */}
               Datos del Destinatario
             </h2>
             {isLoading ? (
               <div className="flex justify-center items-center h-32"> {/* Más altura para el loader */}
                 <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12" style={{ borderTopColor: '#3b82f6' /* blue-500 */ }}></div>
               </div>
             ) : errorMessage ? (
               <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"> {/* Estilo de alerta */}
                 <p className="font-bold">¡Error!</p>
                 <p>{errorMessage}</p>
               </div>
             ) : (
               selectedRecipient && (
                 <dl className="space-y-3 text-sm text-gray-700"> {/* Más espacio */}
                   <div className="flex flex-col sm:flex-row sm:justify-between">
                     <dt className="font-medium text-gray-600">Nombre:</dt>
                     <dd className="sm:text-right">{selectedRecipient.nombre || 'N/A'}</dd>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:justify-between">
                     <dt className="font-medium text-gray-600">Email:</dt>
                     <dd className="sm:text-right">{selectedRecipient.correo || 'N/A'}</dd>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:justify-between">
                     <dt className="font-medium text-gray-600">Dirección:</dt>
                     {/* Usar el campo correcto que devuelve tu API, ej. direccionEntrega */}
                     <dd className="sm:text-right">{selectedRecipient.direccionEntrega || selectedRecipient.direccion_entrega || 'No disponible'}</dd>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:justify-between">
                     <dt className="font-medium text-gray-600">Celular:</dt>
                     <dd className="sm:text-right">{selectedRecipient.celular || 'N/A'}</dd>
                   </div>
                   {/* Ejemplo: Añadir más campos si existen */}
                   {selectedRecipient.numeroDocumento && (
                       <div className="flex flex-col sm:flex-row sm:justify-between">
                         <dt className="font-medium text-gray-600">Documento:</dt>
                         <dd className="sm:text-right">{selectedRecipient.tipoDocumento || ''} {selectedRecipient.numeroDocumento}</dd>
                       </div>
                   )}
                 </dl>
               )
             )}
             {/* Botón Cerrar en el pie del modal */}
              {!isLoading && ( // Ocultar si está cargando
                <div className="mt-6 text-right">
                  <button
                    onClick={closeModal}
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              )}
           </div>
         </div>
       )}

       {/* Estilos para Animación del Modal y Loader (Global o dentro del componente) */}
       <style jsx global>{`
         @keyframes modal-appear {
           from { transform: scale(0.95); opacity: 0; }
           to { transform: scale(1); opacity: 1; }
         }
         .animate-modal-appear {
           animation: modal-appear 0.3s ease-out forwards;
         }
         .loader {
           animation: spin 1s linear infinite;
         }
         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }
       `}</style>


      {/* Paginación */}
      <div className="mt-6 flex items-center justify-center">
         <div className="flex flex-wrap justify-center items-center gap-2"> {/* items-center añadido */}
          <button
             onClick={() => table.setPageIndex(0)}
             disabled={!table.getCanPreviousPage()}
             className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
           >
             Primera
           </button>
           <button
             onClick={() => table.previousPage()}
             disabled={!table.getCanPreviousPage()}
             className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
           >
             Anterior
           </button>
           <span className="text-xs text-gray-700 px-2 hidden sm:inline-block"> {/* Oculto en móviles pequeños */}
             Página{' '}
             <strong>
               {table.getPageCount() > 0 ? table.getState().pagination.pageIndex + 1 : 0} de{' '}
               {table.getPageCount()}
             </strong>
           </span>
           <button
             onClick={() => table.nextPage()}
             disabled={!table.getCanNextPage()}
             className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
           >
             Siguiente
           </button>
           <button
             onClick={() => table.setPageIndex(table.getPageCount() - 1)}
             disabled={!table.getCanNextPage()}
             className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
           >
             Última
           </button>
         </div>
       </div>

     </div>
   );
 }

 export default TanstackReactTable;