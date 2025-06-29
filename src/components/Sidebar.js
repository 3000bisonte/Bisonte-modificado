import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession, signOut } from "next-auth/react";
import PerfilCard from "@/components/PerfilCard";

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
  //console.log("Datos de perfil:", data);
  return data;
}

function Sidebar({ isOpen, onClose }) {
  const { data: session } = useSession(); // Obtener sesión del usuario
  const [miperfil, setMiperfil] = useState([]); // Inicializar como un arreglo vacío
  const [loading, setLoading] = useState(true); // Estado para manejar la carga
  const [error, setError] = useState(null); // Estado para manejar errores
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
        const data = await fetchPerfil();
        // Verificar si los datos devueltos son un arreglo
        if (Array.isArray(data)) {
          setMiperfil(data); // Guardar los datos si es un arreglo
        } else {
          setMiperfil([]); // En caso de que no sea un arreglo, lo inicializamos vacío
        }
        setLoading(false); // Detener el estado de carga
      } catch (error) {
        setError(error.message); // Manejar el error si ocurre
        setLoading(false);
      }
    };
    loadPerfil();
  }, []);

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
