// Placeholder repository; swap mock with Prisma as needed
export type Remitente = {
  id: number;
  nombre: string;
  celular: string;
  direccion?: string;
  ciudad: string;
  documento?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
};

type RemitenteInput = Partial<Remitente> & { telefono?: string };

export function createRemitente(data: RemitenteInput): Remitente {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    nombre: data.nombre || 'Sin nombre',
  celular: String((data).celular || (data).telefono || ''),
    direccion: data.direccion || 'Dirección no especificada',
    ciudad: data.ciudad || 'N/A',
    documento: data.documento || 'Sin documento',
    email: data.email || 'sin-email@ejemplo.com',
    createdAt: now,
    updatedAt: now,
  };
}

export function updateRemitente(id: number, data: RemitenteInput): Remitente {
  const now = new Date().toISOString();
  return {
    id,
    nombre: data.nombre || 'Sin nombre',
  celular: String((data).celular || (data).telefono || ''),
    direccion: data.direccion || 'Dirección no especificada',
    ciudad: data.ciudad || 'N/A',
    documento: data.documento || 'Sin documento',
    email: data.email || 'sin-email@ejemplo.com',
    createdAt: now,
    updatedAt: now,
  };
}
