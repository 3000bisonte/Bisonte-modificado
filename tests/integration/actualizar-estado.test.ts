/**
 * Integration Tests - Actualización de estado de envíos
 * 
 * Prueba el endpoint PATCH /api/envios/actualizar-estado/[id] con validación Zod y transacciones
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Integration: Actualizar Estado de Envío', () => {
  let testEnvioId: number | null = null;

  beforeAll(async () => {
    // Crear envío de prueba
    const envioData = {
      NumeroGuia: `TEST-ESTADO-${Date.now()}`,
      Estado: 'RECOLECCION_PENDIENTE',
      Origen: 'Bogotá',
      Destino: 'Medellín',
      Destinatario: {
        Nombre: 'Test User',
        Direccion: 'Test Address',
        Telefono: '3001234567',
      },
      Remitente: {
        Nombre: 'Test Sender',
        Direccion: 'Sender Address',
        Telefono: '3109876543',
      },
      Peso: 1.5,
      Dimensiones: '20x15x10',
      ValorDeclarado: 75000,
    };

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envioData),
    });

    const data = await response.json();
    testEnvioId = data.id;
  });

  afterAll(async () => {
    // Limpiar envío de prueba
    if (testEnvioId) {
      await fetch(`${API_BASE_URL}/api/orders/${testEnvioId}`, {
        method: 'DELETE',
      });
    }
  });

  it('debe actualizar correctamente el estado de un envío', async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/envios/actualizar-estado/${testEnvioId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'RECOGIDO_TRANSPORTADORA' }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('envio');
    expect(data.envio.Estado).toBe('RECOGIDO_TRANSPORTADORA');
  });

  it('debe rechazar actualización a estado terminal (ENTREGADO)', async () => {
    // Primero, actualizar a estado terminal
    await fetch(`${API_BASE_URL}/api/envios/actualizar-estado/${testEnvioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado: 'ENTREGADO' }),
    });

    // Intentar actualizar nuevamente
    const response = await fetch(
      `${API_BASE_URL}/api/envios/actualizar-estado/${testEnvioId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'EN_TRANSPORTE' }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('estado terminal');
  });

  it('debe rechazar actualización con estado inválido', async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/envios/actualizar-estado/${testEnvioId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'ESTADO_INEXISTENTE' }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('errors');
  });

  it('debe retornar 404 para envío inexistente', async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/envios/actualizar-estado/999999`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'EN_TRANSPORTE' }),
      }
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('no debe actualizar si el estado actual es el mismo que el nuevo', async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/envios/actualizar-estado/${testEnvioId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'ENTREGADO' }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('ya se encuentra en este estado');
  });
});
