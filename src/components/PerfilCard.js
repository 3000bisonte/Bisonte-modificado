"use client";
import { useRouter } from "next/navigation";

function PerfilCard({ perf }) {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        router.push(`/profile/edit/${perf.id}`);
      }}
    >
      {/* <h3>{perf.nombre}</h3> */}
      Editar perfil
    </div>
  );
}

export default PerfilCard;
