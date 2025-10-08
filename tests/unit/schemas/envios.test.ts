/**
 * Unit Tests - Schemas Zod de Envíos
 * 
 * Prueba la validación de los schemas sin necesidad de API
 */

import {
  crearEnvioSchema,
  actualizarEstadoEnvioSchema,
  calcularTarifaSchema,
  EstadoEnvio,
} from '@/schemas/envios';

describe('Schema: crearEnvioSchema', () => {
  const validEnvioData = {
    NumeroGuia: 'TEST-123456',
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

  it('debe validar correctamente un envío válido', () => {
    const result = crearEnvioSchema.safeParse(validEnvioData);
    expect(result.success).toBe(true);
    if (result.success) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.data.NumeroGuia).toBe('TEST-123456');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.data.Peso).toBe(2.5);
    }
  });

  it('debe rechazar envío sin NumeroGuia', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { NumeroGuia, ...invalidData } = validEnvioData;

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.error.issues).toHaveLength(1);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.error.issues[0].path).toContain('NumeroGuia');
    }
  });

  it('debe rechazar envío con peso negativo', () => {
    const invalidData = { ...validEnvioData, Peso: -5 };

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      // eslint-disable-next-line jest/no-conditional-expect
      const pesoError = result.error.issues.find((issue: { path: (string | number)[] }) => issue.path[0] === 'Peso');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(pesoError).toBeDefined();
    }
  });

  it('debe rechazar envío con peso cero', () => {
    const invalidData = { ...validEnvioData, Peso: 0 };

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar envío con estado inválido', () => {
    const invalidData = { ...validEnvioData, Estado: 'ESTADO_INEXISTENTE' };

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      // eslint-disable-next-line jest/no-conditional-expect
      const estadoError = result.error.issues.find((issue: { path: (string | number)[] }) => issue.path[0] === 'Estado');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(estadoError).toBeDefined();
    }
  });

  it('debe rechazar envío sin Destinatario', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Destinatario, ...invalidData } = validEnvioData;

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar envío sin Remitente', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Remitente, ...invalidData } = validEnvioData;

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar envío con ValorDeclarado negativo', () => {
    const invalidData = { ...validEnvioData, ValorDeclarado: -1000 };

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe aceptar envío con Dimensiones opcional', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Dimensiones, ...dataWithoutDimensiones } = validEnvioData;

    const result = crearEnvioSchema.safeParse(dataWithoutDimensiones);
    expect(result.success).toBe(true);
  });

  it('debe rechazar Destinatario sin Nombre', () => {
    const invalidData = {
      ...validEnvioData,
      Destinatario: {
        Direccion: 'Calle 123',
        Telefono: '3001234567',
      },
    };

    const result = crearEnvioSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe validar todos los estados de EstadoEnvio', () => {
    const estados = [
      'RECOLECCION_PENDIENTE',
      'RECOGIDO_TRANSPORTADORA',
      'EN_TRANSPORTE',
      'EN_CIUDAD_DESTINO',
      'EN_DISTRIBUCION',
      'ENTREGADO',
      'NO_ENTREGADO',
      'DEVOLUCION',
      'DEVUELTO_ORIGEN',
      'ENVIO_CANCELADO',
      'REPROGRAMAR',
      'EN_ESPERA_CLIENTE',
    ];

    estados.forEach((estado) => {
      const data = { ...validEnvioData, Estado: estado };
      const result = crearEnvioSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Schema: actualizarEstadoEnvioSchema', () => {
  it('debe validar correctamente un estado válido', () => {
    const result = actualizarEstadoEnvioSchema.safeParse({
      nuevoEstado: 'EN_TRANSPORTE',
    });
    expect(result.success).toBe(true);
  });

  it('debe rechazar estado inválido', () => {
    const result = actualizarEstadoEnvioSchema.safeParse({
      nuevoEstado: 'ESTADO_FALSO',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar sin nuevoEstado', () => {
    const result = actualizarEstadoEnvioSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Schema: calcularTarifaSchema', () => {
  const validTarifaData = {
    origen: 'Bogotá',
    destino: 'Medellín',
    peso: 2.5,
    valorDeclarado: 100000,
  };

  it('debe validar correctamente datos válidos', () => {
    const result = calcularTarifaSchema.safeParse(validTarifaData);
    expect(result.success).toBe(true);
    if (result.success) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.data.origen).toBe('Bogotá');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(result.data.peso).toBe(2.5);
    }
  });

  it('debe rechazar sin origen', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { origen, ...invalidData } = validTarifaData;

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar sin destino', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { destino, ...invalidData } = validTarifaData;

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar peso negativo', () => {
    const invalidData = { ...validTarifaData, peso: -1 };

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar peso cero', () => {
    const invalidData = { ...validTarifaData, peso: 0 };

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar valorDeclarado negativo', () => {
    const invalidData = { ...validTarifaData, valorDeclarado: -5000 };

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe aceptar valorDeclarado cero', () => {
    const data = { ...validTarifaData, valorDeclarado: 0 };

    const result = calcularTarifaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('debe rechazar origen muy corto', () => {
    const invalidData = { ...validTarifaData, origen: 'B' };

    const result = calcularTarifaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('EstadoEnvio Enum', () => {
  it('debe incluir todos los estados esperados', () => {
    const estados = EstadoEnvio._def.values;
    expect(estados).toContain('RECOLECCION_PENDIENTE');
    expect(estados).toContain('ENTREGADO');
    expect(estados).toContain('ENVIO_CANCELADO');
  });

  it('debe tener exactamente 12 estados', () => {
    const estados = EstadoEnvio._def.values;
    expect(estados).toHaveLength(12);
  });

  it('debe validar correctamente estados válidos', () => {
    const result1 = EstadoEnvio.safeParse('ENTREGADO');
    expect(result1.success).toBe(true);

    const result2 = EstadoEnvio.safeParse('EN_TRANSPORTE');
    expect(result2.success).toBe(true);
  });

  it('debe rechazar estados inválidos', () => {
    const result = EstadoEnvio.safeParse('ESTADO_INVALIDO');
    expect(result.success).toBe(false);
  });
});
