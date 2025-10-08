import { createRemitente, updateRemitente } from '../repositories/remitenteRepository';
import type { RemitenteCreate, RemitenteUpdate } from '../schemas/remitente';

export function createRemitenteSvc(input: RemitenteCreate) {
  const celular = input.celular || input.telefono || '';
  return createRemitente({ ...input, celular });
}

export function updateRemitenteSvc(input: RemitenteUpdate) {
  const id = typeof input.id === 'string' ? parseInt(input.id, 10) : input.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
  const { id: _omit, ...data } = input as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return updateRemitente(id, { ...data });
}
