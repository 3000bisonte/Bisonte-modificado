/**
 * Integration Tests - Flujo de creación de envíos
 * 
 * Prueba el endpoint POST /api/orders con validación Zod y transacciones Prisma
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Integration: Crear Envío', () => {
  let testEnvioId: number | null = null;

  afterAll(async () => {
    // Limpiar envío de prueba
    if (testEnvioId) {
      await fetch(`${API_BASE_URL}/api/orders/${testEnvioId}`, {
        method: 'DELETE',
      });
    }
  });

  it('debe crear un envío válido con todos los campos requeridos', async () => {
    const envioData = {
      NumeroGuia: `TEST-${Date.now()}`,
      Estado: 'RECOLECCION_PENDIENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Destinatario: {
        Nombre: 'Juan Pérez',
        Direccion: 'Calle 123 #45-67',
        Telefono: '3001234567',
      },
      Remitente: {
        Nombre: 'María López',
        Direccion: 'Carrera 89 #12-34',
        Telefono: '3109876543',
      },
      Peso: 2.5,
      Dimensiones: '30x20x15',
      ValorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioData),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.NumeroGuia).toBe(envioData.NumeroGuia);
    expect(data.Estado).toBe(envioData.Estado);
    expect(data.Peso).toBe(envioData.Peso);

    testEnvioId = data.id;
  });

  it('debe rechazar un envío sin número de guía', async () => {
    const envioInvalido = {
      Estado: 'RECOLECCION_PENDIENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Destinatario: {
        Nombre: 'Juan Pérez',
        Direccion: 'Calle 123 #45-67',
        Telefono: '3001234567',
      },
      Remitente: {
        Nombre: 'María López',
        Direccion: 'Carrera 89 #12-34',
        Telefono: '3109876543',
      },
      Peso: 2.5,
      Dimensiones: '30x20x15',
      ValorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioInvalido),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('message', 'Datos de envío inválidos');
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('NumeroGuia');
  });

  it('debe rechazar un envío con peso negativo', async () => {
    const envioInvalido = {
      NumeroGuia: `TEST-${Date.now()}`,
      Estado: 'RECOLECCION_PENDIENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Destinatario: {
        Nombre: 'Juan Pérez',
        Direccion: 'Calle 123 #45-67',
        Telefono: '3001234567',
      },
      Remitente: {
        Nombre: 'María López',
        Direccion: 'Carrera 89 #12-34',
        Telefono: '3109876543',
      },
      Peso: -5,
      Dimensiones: '30x20x15',
      ValorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioInvalido),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('Peso');
  });

  it('debe rechazar un envío con estado inválido', async () => {
    const envioInvalido = {
      NumeroGuia: `TEST-${Date.now()}`,
      Estado: 'ESTADO_INEXISTENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Destinatario: {
        Nombre: 'Juan Pérez',
        Direccion: 'Calle 123 #45-67',
        Telefono: '3001234567',
      },
      Remitente: {
        Nombre: 'María López',
        Direccion: 'Carrera 89 #12-34',
        Telefono: '3109876543',
      },
      Peso: 2.5,
      Dimensiones: '30x20x15',
      ValorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioInvalido),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('Estado');
  });

  it('debe rechazar un envío sin datos de destinatario', async () => {
    const envioInvalido = {
      NumeroGuia: `TEST-${Date.now()}`,
      Estado: 'RECOLECCION_PENDIENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Remitente: {
        Nombre: 'María López',
        Direccion: 'Carrera 89 #12-34',
        Telefono: '3109876543',
      },
      Peso: 2.5,
      Dimensiones: '30x20x15',
      ValorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioInvalido),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('Destinatario');
  });
});
