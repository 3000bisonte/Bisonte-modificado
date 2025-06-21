import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

const VALID_STATUSES = [
  "RECOLECCION_PENDIENTE",
  "RECOGIDO_TRANSPORTADORA",
  "EN_TRANSPORTE",
  "ENTREGADO",
  "DEVOLUCION",
  "REPROGRAMAR",
  // ...otros estados
];
const TRANSICIONES_VALIDAS = {
  RECOLECCION_PENDIENTE: [
    "RECOGIDO_TRANSPORTADORA",
    "REPROGRAMAR", // Reprogramar la recolección
    "ENVIO_CANCELADO",
  ],
  RECOGIDO_TRANSPORTADORA: [
    "EN_TRANSPORTE",
    "ENVIO_CANCELADO", // Si aún no ha salido del centro de origen
  ],
  EN_TRANSPORTE: [
    "EN_CIUDAD_DESTINO",
    "DEVOLUCION", // Si hay un problema mayor en ruta
    "REPROGRAMAR", // Por algún imprevisto en el transporte
  ],
  EN_CIUDAD_DESTINO: [
    "EN_DISTRIBUCION",
    "DEVOLUCION",
    "REPROGRAMAR", // Antes de salir a reparto
  ],
  EN_DISTRIBUCION: [
    "ENTREGADO",
    "NO_ENTREGADO",
    "REPROGRAMAR", // Cliente solicita cambio de hora/día
    "DEVOLUCION", // Si el destinatario rechaza o es imposible entregar
  ],
  ENTREGADO: [
    // Generalmente estado final. Podrías tener "DEVOLUCION_POST_ENTREGA" si es un caso muy específico.
  ],
  NO_ENTREGADO: [
    // Tras un intento fallido
    "EN_DISTRIBUCION", // Para un nuevo intento de entrega
    "REPROGRAMAR", // Acordar nueva fecha/hora con el cliente
    "DEVOLUCION", // Si el cliente no responde o es imposible entregar
    "EN_ESPERA_CLIENTE", // Si se necesita confirmación del cliente antes de otro intento
  ],
  REPROGRAMAR: [
    // Desde aquí se puede volver a varios estados dependiendo del contexto
    "RECOLECCION_PENDIENTE", // Si se reprograma la recolección inicial
    "EN_DISTRIBUCION", // Si se reprograma una entrega fallida
    "EN_CIUDAD_DESTINO", // Si se reprogramó antes de salir a reparto
    "ENVIO_CANCELADO", // Si al reprogramar se decide cancelar
  ],
  DEVOLUCION: [
    "DEVUELTO_ORIGEN",
    "EN_TRANSPORTE", // Si la devolución también tiene un "en tránsito"
  ],
  DEVUELTO_ORIGEN: [
    // Estado final
  ],
  ENVIO_CANCELADO: [
    // Estado final
  ],
  EN_ESPERA_CLIENTE: [
    // Estado introducido en NO_ENTREGADO
    "EN_DISTRIBUCION",
    "REPROGRAMAR",
    "DEVOLUCION",
  ],
};

if (!VALID_STATUSES.includes("EN_ESPERA_CLIENTE")) {
  VALID_STATUSES.push("EN_ESPERA_CLIENTE");
}

const ESTADOS_FINALES = ["ENTREGADO", "ENVIO_CANCELADO", "DEVUELTO_ORIGEN"];

export async function PATCH(request, { params }) {
  const guiaId = Number(params.guiaId);
  const { nuevoEstado } = await request.json();

  if (!guiaId) {
    return NextResponse.json(
      { message: "ID de guia requerido" },
      { status: 400 }
    );
  }

  if (!nuevoEstado || !VALID_STATUSES.includes(nuevoEstado)) {
    return NextResponse.json(
      { message: "Estado nuevo inválido o no proporcionado" },
      { status: 400 }
    );
  }

  //console.log(data);
  try {
    const envioExistente = await prisma.historialEnvio.findUnique({
      where: {
        id: guiaId,
      },
    });

    if (!envioExistente) {
      return NextResponse.json(
        { message: "Envío no encontrado" },
        { status: 404 }
      );
    }
    const estadoActual = envioExistente.Estado;

    // 4. Lógica de Transición de Estados
    if (estadoActual === nuevoEstado) {
      return NextResponse.json(
        {
          message:
            "El envío ya se encuentra en este estado. No se requiere actualización.",
          envio: envioExistente,
        },
        { status: 200 } // O 400 si prefieres considerarlo un error de solicitud
      );
    }
    if (ESTADOS_FINALES.includes(estadoActual)) {
      return NextResponse.json(
        {
          message: `El envío está en un estado final ('${estadoActual}') y no puede ser modificado a '${nuevoEstado}'.`,
        },
        { status: 400 }
      );
    }
    const transicionesPermitidasDesdeActual =
      TRANSICIONES_VALIDAS[estadoActual];

    if (!transicionesPermitidasDesdeActual) {
      // Esto indica un problema en la definición de TRANSICIONES_VALIDAS o un estado corrupto en la DB
      console.error(
        `Error crítico: El estado actual '${estadoActual}' del envío ID ${guiaId} no tiene transiciones definidas.`
      );
      return NextResponse.json(
        {
          message: `Configuración interna errónea: No hay transiciones definidas para el estado actual '${estadoActual}'. Contacte al administrador.`,
        },
        { status: 500 } // Error del servidor porque la configuración es incorrecta
      );
    }
    if (!transicionesPermitidasDesdeActual.includes(nuevoEstado)) {
      return NextResponse.json(
        {
          message: `Transición de estado no permitida: de '${estadoActual}' a '${nuevoEstado}'.`,
          estadosPermitidos: transicionesPermitidasDesdeActual,
        },
        { status: 400 } // Bad Request, la transición solicitada no es válida
      );
    }
    const dataToUpdate = {
      Estado: nuevoEstado,
      // Opcional: Actualizar fecha de última modificación
      // fechaUltimaActualizacion: new Date(),
    };
    const updatedEnvio = await prisma.historialEnvio.update({
      where: {
        id: guiaId,
      },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedEnvio);
  } catch (error) {
    console.error("Error al actualizar el estado del envío:", error);
    if (error.code === "P2025") {
      // "Record to update not found"
      return NextResponse.json(
        {
          message:
            "Envío no encontrado al intentar actualizar. Puede que haya sido eliminado.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el estado del envío" },
      { status: 500 }
    );
  }
}
