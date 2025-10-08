/**
 * Integration Tests - Cálculo de tarifas
 * 
 * Prueba el endpoint POST /api/tarifas/calcular con validación Zod
 */

import { describe, it, expect } from '@jest/globals';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Integration: Calcular Tarifa', () => {
  it('debe calcular correctamente la tarifa para un envío dentro de la misma ciudad', async () => {
    const tarifaRequest = {
      origen: 'Bogotá',
      destino: 'Bogotá',
      peso: 1.0,
      valorDeclarado: 50000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('tarifa');
    expect(data).toHaveProperty('moneda', 'COP');
    expect(data).toHaveProperty('tiempoEstimadoDias', 1); // Misma ciudad = 1 día
    expect(data).toHaveProperty('desglose');
    expect(data.desglose).toHaveProperty('tarifaBase');
    expect(data.desglose).toHaveProperty('costoPeso');
    expect(data.desglose).toHaveProperty('costoSeguro');
  });

  it('debe calcular correctamente la tarifa entre ciudades principales', async () => {
    const tarifaRequest = {
      origen: 'Bogotá',
      destino: 'Medellín',
      peso: 3.5,
      valorDeclarado: 200000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('tarifa');
    expect(data.tiempoEstimadoDias).toBe(2); // Ciudades principales = 2 días
    expect(data.desglose.costoPeso).toBe(2.5 * 2000); // 2.5 kg adicionales * 2000 COP
    expect(data.desglose.costoSeguro).toBe(200000 * 0.01); // 1% del valor declarado
  });

  it('debe calcular correctamente la tarifa para destinos no principales', async () => {
    const tarifaRequest = {
      origen: 'Bogotá',
      destino: 'Popayán',
      peso: 2.0,
      valorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('tarifa');
    expect(data.tiempoEstimadoDias).toBe(3); // Otros destinos = 3 días
  });

  it('debe rechazar solicitud sin origen', async () => {
    const tarifaInvalida = {
      destino: 'Medellín',
      peso: 2.0,
      valorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaInvalida),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('origen');
  });

  it('debe rechazar solicitud con peso negativo', async () => {
    const tarifaInvalida = {
      origen: 'Bogotá',
      destino: 'Medellín',
      peso: -1.5,
      valorDeclarado: 100000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaInvalida),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('peso');
  });

  it('debe rechazar solicitud con valor declarado negativo', async () => {
    const tarifaInvalida = {
      origen: 'Bogotá',
      destino: 'Medellín',
      peso: 2.0,
      valorDeclarado: -50000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaInvalida),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data.errors).toHaveProperty('valorDeclarado');
  });

  it('debe aplicar tarifa base por defecto para ciudades no especificadas', async () => {
    const tarifaRequest = {
      origen: 'Ciudad Desconocida',
      destino: 'Otra Ciudad Desconocida',
      peso: 1.0,
      valorDeclarado: 50000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.desglose.tarifaBase).toBe(10000); // Tarifa DEFAULT
  });

  it('debe calcular correctamente el seguro como 1% del valor declarado', async () => {
    const tarifaRequest = {
      origen: 'Bogotá',
      destino: 'Cali',
      peso: 1.0,
      valorDeclarado: 500000,
    };

    const response = await fetch(`${API_BASE_URL}/api/tarifas/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifaRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.desglose.costoSeguro).toBe(5000); // 1% de 500000
  });
});
