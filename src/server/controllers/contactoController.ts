import { NextResponse } from 'next/server';
import type { ContactoCreate } from '../schemas/contacto';
import { createContactoSvc } from '../services/contactoService';

export async function createContacto(body: ContactoCreate) {
  const nuevo = await createContactoSvc(body);
  return NextResponse.json({ success: true, mensaje: 'Mensaje enviado correctamente', data: nuevo }, { status: 201 });
}
