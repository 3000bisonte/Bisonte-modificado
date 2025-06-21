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
    <div
      className={`fixed inset-0 z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-out bg-[#e2e8f0]/90 text-[#2d3748] w-64 h-full overflow-y-auto`}
    >
      {/* Botón para cerrar el sidebar */}
      <button
        className="text-[#2d3748] p-4 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        onClick={onClose}
        aria-label="Cerrar Sidebar"
      >
        ✕
      </button>

      {/* Mostrar la información de sesión o el botón para iniciar sesión */}
      {session?.user ? (
        <div
          className="flex items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"
          title="Ver perfil"
          //onClick={() => (window.location.href = "/profile")}
        >
          <img
            className="w-10 h-10 rounded-full"
            src={session.user.image}
            alt="User Avatar"
          />
          <span className="ml-3 text-lg font-bold">{session.user.name}</span>
        </div>
      ) : (
        <div className="p-4">
          <button
            onClick={() => signIn()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center focus:outline-none focus:ring-2 focus:ring-blue-700"
            aria-label="Iniciar sesión"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
            Accede a tu cuenta
          </button>
        </div>
      )}

      {/* Mostrar el perfil y enlaces internos */}
      <div className="text-[#2d3748] p-4 mt-4">
        {loading && <p>Cargando perfil...</p>}
        {error && <p>Error al cargar perfil: {error}</p>}
        {!loading && !error && (
          <>
            {miperfil.map((perf) => {
              if (perf.correo === session?.user?.email) {
                return <PerfilCard perf={perf} key={perf.id} />;
              }
              // <PerfilCard perf={perf} key={perf.id} />
            })}
          </>
        )}
      </div>

      {/* Separador visual */}
      <hr className="border-gray-300 my-4" />
      <div className="p-4">
        <Link
          href="/misenvios"
          className="text-[#2d3748] hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Mis Envíos
        </Link>
      </div>
      <div className="p-4">
        <Link
          href="/politica-datos"
          className="text-[#2d3748] hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Tratamiento de Datos
        </Link>
      </div>
      <div className="p-4">
        <Link
          href="/terminos"
          className="text-[#2d3748] hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Condiciones de Servicio
        </Link>
      </div>
      <div className="p-4">
        <Link
          href="/contacto"
          className="text-[#2d3748] hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Contáctanos
        </Link>
      </div>
      {/* Botón de logout */}
      {session?.user && (
        <div className="p-4">
          <button
            className="text-[#2d3748] hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={() =>
              signOut({ callbackUrl: `${window.location.origin}/` })
            }
            aria-label="Cerrar sesión"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
