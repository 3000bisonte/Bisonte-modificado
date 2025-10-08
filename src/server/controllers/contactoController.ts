import { NextResponse } from 'next/server';

import type { ContactoCreate } from '../schemas/contacto';
import { createContactoSvc } from '../services/contactoService';

export async function createContacto(body: ContactoCreate) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const nuevo = await createContactoSvc(body);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return NextResponse.json({ success: true, mensaje: 'Mensaje enviado correctamente', data: nuevo }, { status: 201 });
}
