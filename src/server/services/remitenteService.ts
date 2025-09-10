import { createRemitente, updateRemitente } from '../repositories/remitenteRepository';
import type { RemitenteCreate, RemitenteUpdate } from '../schemas/remitente';

export async function createRemitenteSvc(input: RemitenteCreate) {
  const celular = input.celular || input.telefono || '';
  return createRemitente({ ...input, celular });
}

export async function updateRemitenteSvc(input: RemitenteUpdate) {
  const id = typeof input.id === 'string' ? parseInt(input.id, 10) : input.id;
  const { id: _omit, ...data } = input as any;
  return updateRemitente(id, { ...data });
}
