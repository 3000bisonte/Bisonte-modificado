"use client";

import React, { useState, useEffect } from "react";
import MenuButton from "../components/MenuButton";
import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import ModalFormularioPerfil from "@/components/ModalGuardarPerfil";
import ConsentModal from "@/components/ConsentModal";

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
  //console.log("Datos de perfil-desde-cotizador:", data);
  return data;
}

const Home = () => {
  const { data: session } = useSession();

  const [miperfil, setMiperfil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const datos = {
    correo: session?.user?.email ?? "",
    nickname: session?.user?.name ?? "",
  };

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
  // useEffect(() => {
  //   const storedProfile = localStorage.getItem("dataPerfilSidebar");
  //   if (storedProfile) {
  //     const profile = JSON.parse(storedProfile);
  //     setMiperfil(profile);
  //   }
  // }, []);
  // console.log("Datos de perfil-home--------------->:", miperfil);
  // useEffect(() => {
  //   const guardarUsuario = async () => {
  //     try {
  //       if (session?.user) {
  //         const email = session.user.email;
  //         // Llamada para verificar si el perfil ya existe
  //         console.log("Correo electrónico del usuario-home:", email);

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
  //           console.log("El usuario ya existe-home:", existingUser);
  //           setMiperfil(existingUser);
  //         }

  //         setMiperfil(existingUser);
  //         // localStorage.setItem("userId", data.id);
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
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  // Combinamos ambos efectos en uno solo para manejar la lógica de forma más coherente
  useEffect(() => {
    // Solo procedemos si tenemos sesión y datos cargados
    if (!loading && session?.user?.email && miperfil.length > 0) {
      console.log("Verificando si el usuario existe en la base de datos");
      
      // Verificamos si el usuario existe en la base de datos
      const usuarioExiste = miperfil.some(
        (perf) => perf.correo === session.user.email
      );
      
      console.log("¿Usuario existe?", usuarioExiste);
      
      // Verificamos si hay un parámetro en la URL
      if (typeof window !== "undefined") {
        const query = new URLSearchParams(window.location.search);
        const showModalParam = query.get("showProfileModal") === "true";
        
        // Si hay parámetro en la URL, lo eliminamos independientemente del resultado
        if (showModalParam) {
          router.replace("/home", undefined, { shallow: true });
        }
      }
      
      // Solo mostramos el modal si el usuario NO existe en la base de datos
      if (!usuarioExiste) {
        console.log("Usuario no existe, abriendo modal para crear perfil");
        setIsModalOpen(true);
      } else {
        console.log("Usuario ya existe, no se muestra el modal");
        setIsModalOpen(false);
      }
    }
  }, [miperfil, session?.user?.email, loading, router]);
  const handleSolicitarServicio = () => {
    router.push("/cotizador"); // Redirige al cotizador
  };
  const handleConsentAccepted = () => {
    // Aquí puedes proceder con la solicitud del servicio
    console.log(
      "El usuario ha aceptado los términos y el tratamiento de datos."
    );
  };
  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: "#41e0b3" }}
    >
      <ConsentModal onAccept={handleConsentAccepted} />
      {/* Botón de menú y sidebar */}
      <MenuButton onClick={toggleMenu} />
      <Sidebar isOpen={isMenuOpen} onClose={toggleMenu} />

      {/* Contenido principal */}
      <div className="p-4">
        {/* Barra superior con ubicación */}
        <div className="flex justify-between items-center">
          {/* <button onClick={toggleMenu} className="text-white">
            <span className="text-3xl">☰</span>
          </button> */}
          {/* <h2 className="text-white text-lg">Bogotá, D.C.</h2> */}
        </div>

        {/* Imagen o sección principal */}
        <div className="flex flex-col items-center mt-10">
          {/* Texto de bienvenida */}
          <h1 className="text-4xl font-bold text-white text-center leading-tight">
            Pequeños encargos <br /> Grandes soluciones
          </h1>
          {session?.user && (
            <div>
              {/* <button onClick={() => setIsModalOpen(true)} className="btn">
              Abrir Modal
            </button> */}
              {session?.user?.email && (
                <ModalFormularioPerfil
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  perf={datos}
                />
              )}
            </div>
          )}

          {/* Imagen central desde Unsplash */}
          <img
            src="/2149103392.jpg"
            alt="Maleta y llaves"
            className="rounded-full shadow-lg"
          />
        </div>

        {/* Botón para solicitar entrega */}
        <div className="mt-10 bg-white rounded-lg p-4 text-center shadow-md">
          <p className="text-xl font-semibold">Entrega lo que necesites</p>
          <p className="text-gray-500">Empieza ahora</p>
          <button
            className="bg-teal-200 text-gray-700 py-2 px-6 rounded-lg mt-4"
            onClick={handleSolicitarServicio}
          >
            Solicitar servicio
          </button>
        </div>

        {/* Sección de imágenes sugeridas */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <img
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjFwfDB8MHwxfGFsbHwxfHx8fHx8fHwxNjcxMDA4OTAw&ixlib=rb-4.0.3&q=80&w=400"
            alt="Paquete"
            className="rounded-lg shadow-lg"
          />
          <img
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjFwfDB8MHwxfGFsbHwxfHx8fHx8fHwxNjcxMDA4OTAw&ixlib=rb-4.0.3&q=80&w=400"
            alt="Repartidor"
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
