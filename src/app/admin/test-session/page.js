"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestSession() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const ADMIN_EMAILS = [
    "3000bisonte@gmail.com",
    "bisonteangela@gmail.com",
    "bisonteoskar@gmail.com",
    "test@bisonteapp.com",
  ];

  const goToAdmin = () => {
    router.push("/admin/envios");
  };

  const goHome = () => {
    router.push("/home");
  };

  if (status === "loading") {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>⏳ Cargando sesión...</h1>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#ffe6e6" }}>
        <h1>❌ NO AUTENTICADO</h1>
        <p>No hay sesión activa. Debes iniciar sesión primero.</p>
        <button onClick={() => router.push("/")} style={{ padding: "10px 20px", marginTop: "10px" }}>
          Ir a Login
        </button>
      </div>
    );
  }

  const userEmail = session?.user?.email;
  const userRole = session?.user?.role;
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#f0f0f0" }}>
      <h1>🔍 Diagnóstico de Sesión</h1>
      
      <div style={{ backgroundColor: "white", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
        <h2>📊 Estado de la Sesión</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Status:</td>
              <td style={{ padding: "10px" }}>{status}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Email:</td>
              <td style={{ padding: "10px" }}>{userEmail || "No disponible"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Role:</td>
              <td style={{ padding: "10px" }}>
                <span style={{ 
                  backgroundColor: userRole === 'admin' ? '#4CAF50' : '#ff9800',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  {userRole || "No definido"}
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>ID:</td>
              <td style={{ padding: "10px" }}>{session?.user?.id || "No disponible"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Name:</td>
              <td style={{ padding: "10px" }}>{session?.user?.name || "No disponible"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Email Verified:</td>
              <td style={{ padding: "10px" }}>
                {session?.user?.emailVerified ? "✅ Sí" : "❌ No"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
        <h2>🔐 Verificación de Admin</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Email en lista de admins:</td>
              <td style={{ padding: "10px" }}>
                {isAdmin ? 
                  <span style={{ color: "green", fontWeight: "bold" }}>✅ SÍ</span> : 
                  <span style={{ color: "red", fontWeight: "bold" }}>❌ NO</span>
                }
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Role es "admin":</td>
              <td style={{ padding: "10px" }}>
                {userRole === 'admin' ? 
                  <span style={{ color: "green", fontWeight: "bold" }}>✅ SÍ</span> : 
                  <span style={{ color: "red", fontWeight: "bold" }}>❌ NO</span>
                }
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>Puede acceder a /admin:</td>
              <td style={{ padding: "10px" }}>
                {isAdmin ? 
                  <span style={{ color: "green", fontWeight: "bold" }}>✅ SÍ</span> : 
                  <span style={{ color: "red", fontWeight: "bold" }}>❌ NO - Se redirigirá a /</span>
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
        <h2>📝 Lista de Emails Admin</h2>
        <ul>
          {ADMIN_EMAILS.map((email, index) => (
            <li key={index} style={{ 
              padding: "5px",
              color: email === userEmail ? "green" : "black",
              fontWeight: email === userEmail ? "bold" : "normal"
            }}>
              {email} {email === userEmail && "← TÚ"}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
        <h2>🔄 Objeto de Sesión Completo</h2>
        <pre style={{ 
          backgroundColor: "#f5f5f5", 
          padding: "15px", 
          borderRadius: "4px",
          overflow: "auto",
          fontSize: "12px"
        }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={goHome}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          🏠 Ir a Home
        </button>
        
        {isAdmin && (
          <button 
            onClick={goToAdmin}
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            👨‍💼 Ir a Admin Panel
          </button>
        )}

        {!isAdmin && userRole !== 'admin' && (
          <div style={{
            padding: "12px 24px",
            backgroundColor: "#ff5252",
            color: "white",
            borderRadius: "4px",
            fontSize: "16px"
          }}>
            ❌ NO TIENES ACCESO DE ADMIN
          </div>
        )}
      </div>

      <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#fff3cd", borderRadius: "8px" }}>
        <h3>⚠️ Si no ves role: "admin"</h3>
        <ol>
          <li><strong>Cierra sesión</strong> completamente</li>
          <li><strong>Limpia las cookies</strong> del navegador (F12 → Application → Cookies → Clear)</li>
          <li><strong>Cierra el navegador</strong> completamente</li>
          <li><strong>Abre una ventana de incógnito</strong></li>
          <li><strong>Inicia sesión de nuevo</strong> con test@bisonteapp.com</li>
          <li><strong>Vuelve a esta página</strong>: /admin/test-session</li>
        </ol>
      </div>
    </div>
  );
}
