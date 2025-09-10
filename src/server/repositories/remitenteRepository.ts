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

export async function createRemitente(data: RemitenteInput): Promise<Remitente> {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    nombre: data.nombre || 'Sin nombre',
  celular: String((data as RemitenteInput).celular || (data as RemitenteInput).telefono || ''),
    direccion: data.direccion || 'Dirección no especificada',
    ciudad: data.ciudad || 'N/A',
    documento: data.documento || 'Sin documento',
    email: data.email || 'sin-email@ejemplo.com',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateRemitente(id: number, data: RemitenteInput): Promise<Remitente> {
  const now = new Date().toISOString();
  return {
    id,
    nombre: data.nombre || 'Sin nombre',
  celular: String((data as RemitenteInput).celular || (data as RemitenteInput).telefono || ''),
    direccion: data.direccion || 'Dirección no especificada',
    ciudad: data.ciudad || 'N/A',
    documento: data.documento || 'Sin documento',
    email: data.email || 'sin-email@ejemplo.com',
    createdAt: now,
    updatedAt: now,
  };
}
