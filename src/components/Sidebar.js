import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
// import _Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";

// Helper inline para normalizar respuestas del API de perfil
const normalizePerfilesResponse = (response) => {
  if (!response) return [];
  let perfiles = [];
  if (Array.isArray(response)) perfiles = response;
  else if (Array.isArray(response?.perfiles)) perfiles = response.perfiles;
  else if (response?.perfil) perfiles = [response.perfil];
  return perfiles.filter(p => p !== null);
};

// import PerfilCard from "@/components/PerfilCard";


// Función para hacer la llamada a la API
async function fetchPerfil() {
  const response = await fetch("/api/perfil", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Error fetching perfil data");
  }
  const data = await response.json();
  return normalizePerfilesResponse(data);
}

function TanstackReactTable({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Sidebar({ isOpen: _isOpen, onClose: _onClose }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession(); // Obtener sesión del usuario
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_miperfil, setMiperfil] = useState([]); // Inicializar como un arreglo vacío
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(true); // Estado para manejar la carga
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_error, setError] = useState(null); // Estado para manejar errores
  // useEffect(() => {
  //   const guardarUsuario = async () => {
  //     try {
  //       if (session?.user) {
  //         const email = session.user.email;
  //         // Llamada para verificar si el perfil ya existe
  //         console.log("Correo electrónico del usuario:", email);

  //         const checkResponse = await fetch(
  //           `/api/perfil/buscarxemail/${email}`,
  //           {
  //             method: "GET",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //           }
  //         );
  //         const existingUser = await checkResponse.json();

  //         // Si el perfil ya existe, no intentamos crearlo nuevamente
  //         if (existingUser && existingUser.length > 0) {
  //           console.log("El usuario ya existe-SIDEBAR:", existingUser);
  //           return; // Salimos de la función para evitar duplicados
  //         }
  //         const datos = {
  //           correo: session.user.email,
  //           nickname: session.user.name,
  //         };
  //         const response = await fetch("/api/perfil", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(datos),
  //         });
  //         if (!response.ok) {
  //           throw new Error("Failed to fetch profile data");
  //         }
  //         const data = await response.json();
  //         console.log("Fetched data-guardar-datos-sesion:", data);
  //         //setMiperfil(existingUser);
  //         localStorage.setItem("dataPerfilSidebar", JSON.stringify(data));

  //         // localStorage.setItem("email", user.email);
  //         // localStorage.setItem("name", user.name);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       // Aquí puedes manejar el error como prefieras
  //     }
  //   };
  //   guardarUsuario();
  // }, [session?.user]);

  // Cargar los datos del perfil cuando el componente se monte
  useEffect(() => {
    const loadPerfil = async () => {
      try {
        const perfiles = await fetchPerfil();
        setMiperfil(perfiles);
        setLoading(false); // Detener el estado de carga
      } catch (error) {
        setError(error.message); // Manejar el error si ocurre
        setLoading(false);
      }
    };
    loadPerfil();
  }, []);

  // Ejemplo de datos y columnas para la tabla
  const dataCoti = [
    { id: 1, destino: "Bogotá", estado: "En camino" },
    { id: 2, destino: "Medellín", estado: "Entregado" },
  ];

  const columns = [
    { accessorKey: "id", header: "ID", cell: (info) => info.getValue() },
    { accessorKey: "destino", header: "Destino", cell: (info) => info.getValue() },
    { accessorKey: "estado", header: "Estado", cell: (info) => info.getValue() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-teal-600 mb-6 text-center">
          Mis Envíos
        </h2>
        <TanstackReactTable data={dataCoti} columns={columns} />
        {/* Modales y otros elementos siguen el mismo patrón visual */}
      </div>
    </div>
  );
}

export default Sidebar;
