import { z } from "zod";

// Estados válidos para un envío (basados en los usados en la API)
export const EstadoEnvio = z.enum([
  "RECOLECCION_PENDIENTE",
  "RECOGIDO_TRANSPORTADORA",
  "EN_TRANSPORTE",
  "EN_CIUDAD_DESTINO",
  "EN_DISTRIBUCION",
  "ENTREGADO",
  "NO_ENTREGADO",
  "DEVOLUCION",
  "DEVUELTO_ORIGEN",
  "ENVIO_CANCELADO",
  "REPROGRAMAR",
  "EN_ESPERA_CLIENTE",
]);

export type EstadoEnvioType = z.infer<typeof EstadoEnvio>;

// Schema para datos de persona (Destinatario/Remitente)
const PersonaSchema = z.object({
  Nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  Direccion: z.string().trim().min(5, "La dirección debe tener al menos 5 caracteres"),
  Telefono: z.string().trim().regex(/^[0-9]{10}$/, "El teléfono debe tener 10 dígitos"),
});

// Schema para crear un nuevo envío
export const crearEnvioSchema = z.object({
  NumeroGuia: z.string().trim().min(1, "El número de guía es requerido"),
  Estado: EstadoEnvio,
  Origen: z.string().trim().min(2, "El origen debe tener al menos 2 caracteres"),
  Destino: z.string().trim().min(2, "El destino debe tener al menos 2 caracteres"),
  Destinatario: PersonaSchema,
  Remitente: PersonaSchema,
  Peso: z.number().positive("El peso debe ser un número positivo"),
  Dimensiones: z.string().optional(),
  ValorDeclarado: z.number().nonnegative("El valor declarado no puede ser negativo"),
  FechaCreacion: z.date().optional(),
  FechaActualizacion: z.date().optional(),
});

export type CrearEnvioInput = z.infer<typeof crearEnvioSchema>;

// Schema para actualizar estado de envío
export const actualizarEstadoEnvioSchema = z.object({
  nuevoEstado: EstadoEnvio,
});

export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoEnvioSchema>;

// Schema para calcular tarifa (si aplica)
export const calcularTarifaSchema = z.object({
  origen: z.string().trim().min(2),
  destino: z.string().trim().min(2),
  peso: z.number().positive().max(1000).optional(), // kg
  valorDeclarado: z.number().nonnegative().max(50_000_000).optional(),
});

export type CalcularTarifaInput = z.infer<typeof calcularTarifaSchema>;

// Schema de respuesta para tarifa
export const tarifaResponseSchema = z.object({
  tarifa: z.number().positive(),
  moneda: z.string().default("COP"),
  tiempoEstimado: z.string().optional(), // "1-3 días hábiles"
});

export type TarifaResponse = z.infer<typeof tarifaResponseSchema>;
