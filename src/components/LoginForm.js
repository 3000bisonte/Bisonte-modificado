"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import { useRouter } from "next/navigation";
//import { useMessagePort } from "../app/context/MessagePortContext";
const LoginForm = () => {
  //const { setPort } = useMessagePort();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [hasSentPort, setHasSentPort] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event) => {
      var port = event.ports[0];
      if (typeof port === "undefined") return;
      //console.log("port desde login", port);

      port.postMessage("Test");
      // Receive upcoming messages on this port.
      port.onmessage = function (event) {
        console.log("[PostMessage1] Got message" + event.data);
        try {
          let messageData;

          if (typeof event.data === "string") {
            messageData = JSON.parse(event.data);
          } else {
            messageData = event.data; // Si ya es objeto, úsalo directamente
          }

          if (messageData && messageData.type === "myAppMessage") {
            setMessages((prevMessages) => [
              ...prevMessages,
              messageData.content,
            ]);
          } else {
            console.log(
              "[PostMessage] Mensaje no válido o sin tipo esperado",
              messageData
            );
          }
        } catch (error) {
          console.error("[PostMessage] Error al analizar el mensaje:", error);
        }
      };

      if (
        event.origin !==
        "android-app://bisonte-logistica-6od4.vercel.app/app.vercel.bisonte_logistica_6od4.twa"
        //"http://localhost:3000"
      ) {
        console.log(
          "[PostMessage] Mensaje de origen no permitido",
          event.origin
        );
        return;
      }
    };

    // Registra el listener del evento `message`
    window.addEventListener("message", handleMessage);

    // Limpia el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await signIn("google", {
        redirect: false,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      router.push("/home");
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      setErrorMessage(
        "Hubo un problema al iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-3xl font-semibold text-center text-gray-800">
          Iniciar Sesión
        </h2>
        {/* <h1>Mensajes Recibidos:</h1>
        {messages.length > 0 ? (
          <ul>
            {messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ) : (
          <p>No se han recibido mensajes aún.</p>
        )} */}
        {/* Mensaje de error */}
        {errorMessage && (
          <p className="mb-4 text-sm text-center text-red-600 font-bold">
            {errorMessage}
          </p>
        )}

        <GoogleButton
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-12 text-lg flex justify-center items-center bg-black text-white rounded-lg shadow-md hover:bg-gray-800"
        >
          {isLoading ? (
            "Cargando..."
          ) : (
            <>
              <img
                src="/google-icon.svg"
                alt="Google"
                className="w-6 h-6 mr-2"
              />
              Iniciar sesión con Google
            </>
          )}
        </GoogleButton>

        {/* Opción de Registro */}
        <p className="mt-6 text-sm text-center text-gray-600">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/auth/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

// const LoginFormjksdfsdf = () => {
//   const [messages, setMessages] = useState([]); // Estado para almacenar los mensajes
//   const [port, setPort] = useState(null); // Almacenar el puerto recibido

//   useEffect(() => {
//     // Crea un canal de comunicación
//     const channel = new MessageChannel();

//     // Escucha los mensajes que se envían por el puerto 1 del canal
//     channel.port1.onmessage = (messageEvent) => {
//       console.log(
//         "[MessageChannel] Mensaje recibido a través del puerto:",
//         messageEvent.data
//       );
//       setMessages((prevMessages) => [...prevMessages, messageEvent.data]);
//     };

//     const handleMessage = (event) => {
//       console.log("[--------] Got message" + event.data);
//       var port = event.ports[0];
//       if (typeof port === "undefined") return;

//       // Post message on this port.
//       port.postMessage("Test");
//       // Receive upcoming messages on this port.
//       port.onmessage = function (event) {
//         console.log("[PostMessage1] Got message" + event.data);
//         try {
//           let messageData;

//           if (typeof event.data === "string") {
//             messageData = JSON.parse(event.data);
//           } else {
//             messageData = event.data; // Si ya es objeto, úsalo directamente
//           }

//           if (messageData && messageData.type === "myAppMessage") {
//             setMessages((prevMessages) => [
//               ...prevMessages,
//               messageData.content,
//             ]);
//           } else {
//             console.log(
//               "[PostMessage] Mensaje no válido o sin tipo esperado",
//               messageData
//             );
//           }
//         } catch (error) {
//           console.error("[PostMessage] Error al analizar el mensaje:", error);
//         }
//       };

//       //console.log("[PostMessage] Mensaje recibido:", event.data);

//       // Verifica el origen del mensaje (puedes personalizar este origen)
//       if (
//         event.origin !==
//         "android-app://bisonte-logistica-6od4.vercel.app/app.vercel.bisonte_logistica_6od4.twa"
//       ) {
//         console.log(
//           "[PostMessage] Mensaje de origen no permitido",
//           event.origin
//         );
//         return;
//       }

//       // Verifica si el mensaje tiene el formato correcto (por ejemplo, type === "myAppMessage")
//       // if (event.data && event.data.type === "myAppMessage") {
//       //   // Si el mensaje tiene el formato esperado, procesalo
//       //   setMessages((prevMessages) => [...prevMessages, event.data.content]);
//       // } else {
//       //   console.log(
//       //     "[PostMessage] Mensaje no válido o sin tipo esperado",
//       //     event.data
//       //   );
//       // }
//     };

//     // Registra el listener del evento `message`
//     window.addEventListener("message", handleMessage);

//     // Limpia el listener cuando el componente se desmonte
//     return () => {
//       window.removeEventListener("message", handleMessage);
//     };
//   }, []);

//   return (
//     <div>
//       <h1>Mensajes Recibidos:</h1>
//       {messages.length > 0 ? (
//         <ul>
//           {messages.map((message, index) => (
//             <li key={index}>{message}</li>
//           ))}
//         </ul>
//       ) : (
//         <p>No se han recibido mensajes aún.</p>
//       )}
//     </div>
//   );
// };

// //export default LoginFormjksdfsdf;
