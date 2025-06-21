"use client";

import TanstackReactTable from "@/components/ReactTables";
import dayjs from "dayjs";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { signIn, useSession, signOut } from "next-auth/react";

const STATUS_STYLES = {
  RECOLECCION_PENDIENTE: {
    label: "Recolección pendiente",
    color: "bg-blue-100 text-blue-800",
  },
  RECOGIDO_TRANSPORTADORA: {
    label: "Recogido",
    color: "bg-indigo-100 text-indigo-800",
  },
  EN_TRANSPORTE: {
    label: "En Recorrido",
    color: "bg-purple-100 text-purple-800",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "bg-green-100 text-green-800",
  },
  DEVOLUCION: {
    label: "Devolución",
    color: "bg-orange-100 text-orange-800",
  },
  REPROGRAMAR: {
    label: "Reprogramar",
    color: "bg-red-100 text-red-800",
  },
};
const getStatusDisplay = (statusKey) => {
  //console.log("Estado recibido:", statusKey);
  const status = STATUS_STYLES[statusKey];

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
    >
      {status.label}
    </span>
  );
};

const ShippingHistoryForm = () => {
  const { data: session } = useSession();
  const [dataCoti, setDataCoti] = useState([]);
  const [dataPerfilId, setDataPerfilId] = useState(null);
  const perfilIdRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const perfilLoaded = useRef(false);
  const userEmail = session?.user?.email;

  // Estado para el modal de actualización de estado
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedShipmentForUpdate, setSelectedShipmentForUpdate] =
    useState(null);
  const [currentUpdatingStatus, setCurrentUpdatingStatus] = useState(""); // Para el select del modal
  const [isUpdating, setIsUpdating] = useState(false); // Para feedback de carga en el modal

  // useEffect(() => {
  //   const loadPerfilYEnvios = async () => {
  //     try {
  //       const response = await fetch("/api/perfil", {
  //         method: "GET",
  //         headers: { "Content-Type": "application/json" },
  //       });

  //       if (!response.ok) throw new Error("Error al obtener el perfil");

  //       const data = await response.json();
  //       const perfil = data.find((perf) => perf.correo === userEmail);

  //       if (perfil) {
  //         perfilIdRef.current = perfil.id;
  //         console.log("perfil-dentroif--->", perfilIdRef.current);

  //         // Construir la URL y obtener los envíos
  //         const url = `/api/obtenerenvios/${perfil.id}`;
  //         console.log("Construyendo URL con idPerfilUsuario:", url);

  //         const enviosResponse = await fetch(url);
  //         if (!enviosResponse.ok) throw new Error("Error al obtener envíos");

  //         const enviosData = await enviosResponse.json();
  //         setDataCoti(enviosData); // Actualiza la tabla
  //       }
  //     } catch (error) {
  //       console.error("Error al cargar perfil/envíos:", error);
  //     }
  //   };

  //   if (userEmail) {
  //     loadPerfilYEnvios();
  //   }
  // }, [userEmail]);

  // Usamos useCallback para memoizar la función de carga
  const loadEnvios = useCallback(async (perfilId) => {
    if (!perfilId) return;
    try {
      const url = `/api/obtenerenvios/${perfilId}`;
      console.log("Construyendo URL con idPerfilUsuario:", url);
      const enviosResponse = await fetch(url);
      if (!enviosResponse.ok) throw new Error("Error al obtener envíos");
      const enviosData = await enviosResponse.json();
      setDataCoti(enviosData);
    } catch (error) {
      console.error("Error al cargar envíos:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }, []); // No tiene dependencias externas que cambien frecuentemente

  useEffect(() => {
    const loadPerfil = async () => {
      if (!userEmail) return;
      try {
        const response = await fetch("/api/perfil", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Error al obtener el perfil");
        const data = await response.json();
        const perfil = data.find((perf) => perf.correo === userEmail);
        if (perfil) {
          perfilIdRef.current = perfil.id;
          if(perfil.esAdministrador){
            console.log("perfil es admin",perfil);
            setUserRole('admin');
          }else if(perfil.esRecolector){
            console.log("perfil es recolector",perfil);
            setUserRole('recolector');
          }else{
            console.log("perfil es cliente",perfil);
            setUserRole('cliente');
          }
          console.log("perfil-dentroif--->", perfilIdRef.current);
          loadEnvios(perfil.id); // Cargar envíos una vez que tenemos el perfilId
        } else {
          console.log("Perfil no encontrado para el email:", userEmail);
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };

    loadPerfil();
  }, [userEmail, loadEnvios]); // Incluir loadEnvios en las dependencias

  const handleOpenUpdateStatusModal = useCallback((shipment) => {
    setSelectedShipmentForUpdate(shipment);
    setCurrentUpdatingStatus(shipment.Estado); // Estado actual como valor inicial del select
    setIsUpdateStatusModalOpen(true);
  }, []);

  const handleCloseUpdateStatusModal = () => {
    setIsUpdateStatusModalOpen(false);
    setSelectedShipmentForUpdate(null);
    setCurrentUpdatingStatus("");
    setIsUpdating(false);
  };
  const handleConfirmUpdateStatus = async () => {
    if (!selectedShipmentForUpdate || !currentUpdatingStatus) return;

    setIsUpdating(true);
    try {
      // Asumiendo que tu envío tiene un 'id' o 'NumeroGuia' único para identificarlo
      // Ajusta `selectedShipmentForUpdate.id` al identificador correcto de tu envío
      const guiaId =
        selectedShipmentForUpdate.id || selectedShipmentForUpdate.NumeroGuia;

      const response = await fetch(`/api/envios/actualizar-estado/${guiaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado: currentUpdatingStatus }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al actualizar estado" }));
        throw new Error(errorData.message || "Error al actualizar estado");
      }

      // Actualizar la tabla:
      // Opción 1: Re-fetchear los datos
      if (perfilIdRef.current) {
        await loadEnvios(perfilIdRef.current);
      }
      // Opción 2: Actualizar localmente (más complejo, pero mejor UX)
      // setDataCoti(prevData => prevData.map(item =>
      //   (item.id || item.NumeroGuia) === envioId
      //     ? { ...item, Estado: currentUpdatingStatus }
      //     : item
      // ));

      handleCloseUpdateStatusModal();
      // Aquí podrías mostrar un toast de éxito
      alert("Estado actualizado con éxito!");
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert(`Error: ${error.message}`); // Mostrar error al usuario
    } finally {
      setIsUpdating(false);
    }
  };
  const columns = useMemo(() => {
    const baseColumns = [
      { header: "Nº guía", accessorKey: "NumeroGuia" },
      { header: "Origen", accessorKey: "Origen" },
      { header: "Destino", accessorKey: "Destino" },
      { header: "Destinatario", accessorKey: "Destinatario" }, // `Destinatario` es un string en `HistorialEnvio`
      {
        header: "Estado",
        accessorKey: "Estado",
        cell: (info) => getStatusDisplay(info.getValue()),
      },
      {
        header: "Fecha de solicitud",
        accessorKey: "FechaSolicitud",
        cell: (info) => dayjs(info.getValue()).isValid() ? dayjs(info.getValue()).format("DD/MM/YYYY HH:mm") : "Fecha inválida",
      },
    ];

    // Definir qué roles pueden ver la columna de acciones
    // AJUSTA ESTA CONDICIÓN si tienes un rol 'repartidor'
    const canUpdateStatus = userRole === 'admin' || userRole === 'recolector';

    if (canUpdateStatus) {
      return [
        ...baseColumns,
        {
          header: "Acciones",
          id: "actions",
          cell: ({ row }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenUpdateStatusModal(row.original);
              }}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Actualizar Estado
            </button>
          ),
        },
      ];
    }
    return baseColumns;
  }, [userRole, handleOpenUpdateStatusModal]);

  // useEffect(() => {
  //   const envioDatos = JSON.parse(localStorage.getItem("envioDatos"));

  //     const idPerfilUsuario = perfilIdRef.current;
  //     console.log("idPerfilUsuario--->", dataPerfilId);
  //     //setDataPerfilId(idPerfilUsuario);

  //     // Construir la URL con el parámetro idPerfilUsuario

  //     const url = `/api/obtenerenvios/${idPerfilUsuario}`;

  //     // Hacer la petición GET
  //     fetch(url)
  //       .then((response) => response.json())
  //       .then((data) => {
  //         setDataCoti(data); // Asume que data es un array de objetos
  //       })
  //       .catch((error) => {
  //         console.error("Error al obtener los datos:", error);
  //       });

  // }, []);
  console.log("dataCoti->mis-envios", dataCoti);
  return (
    <div>
      <TanstackReactTable data={dataCoti} columns={columns} />

      {/* 3. Modal para Actualizar Estado */}
      {isUpdateStatusModalOpen && selectedShipmentForUpdate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 px-4"
          onClick={handleCloseUpdateStatusModal}
        >
          <div
            className="modal-container bg-white rounded-lg p-6 shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Actualizar Estado del Envío:{" "}
              {selectedShipmentForUpdate.NumeroGuia}
            </h2>
            <div className="mb-4">
              <label
                htmlFor="statusSelect"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nuevo Estado:
              </label>
              <select
                id="statusSelect"
                value={currentUpdatingStatus}
                onChange={(e) => setCurrentUpdatingStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isUpdating}
              >
                {Object.entries(STATUS_STYLES).map(([key, { label }]) => {
                  if (key === "DEFAULT") return null; // No permitir seleccionar "Desconocido"
                  return (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseUpdateStatusModal}
                type="button"
                disabled={isUpdating}
                className="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdateStatus}
                type="button"
                disabled={isUpdating}
                className="rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isUpdating ? "Actualizando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingHistoryForm;
