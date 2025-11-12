import { redirect } from "next/navigation";

export default function AdminIndex() {
  // Redirige al módulo principal del administrador
  redirect("/admin/envios");
}
