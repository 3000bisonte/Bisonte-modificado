import { NextResponse } from 'next/server';

import { calcularTarifaSchema } from '@/schemas/envios';

export const dynamic = 'force-dynamic';

// Tarifas base por ciudad
const TARIFAS_BASE = {
  BOGOTA: 8000,
  MEDELLIN: 9000,
  CALI: 9500,
  BARRANQUILLA: 10000,
  CARTAGENA: 11000,
  DEFAULT: 10000,
};

// Costo por kilogramo adicional
const COSTO_POR_KG = 2000;

// Porcentaje de seguro sobre valor declarado
const PORCENTAJE_SEGURO = 0.01; // 1%

// Tiempos estimados de entrega (en días hábiles)
const TIEMPOS_ENTREGA = {
  MISMA_CIUDAD: 1,
  CIUDADES_PRINCIPALES: 2,
  OTROS_DESTINOS: 3,
};

/**
 * Calcula la tarifa de envío basada en origen, destino, peso y valor declarado
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validar datos de entrada con Zod
    const validationResult = calcularTarifaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos para cálculo de tarifa',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { origen, destino, peso, valorDeclarado } = validationResult.data;

    // Normalizar nombres de ciudades
    const origenNormalizado = origen.toUpperCase().trim();
    const destinoNormalizado = destino.toUpperCase().trim();

    // Obtener tarifa base según destino
    const tarifaBase = TARIFAS_BASE[destinoNormalizado] || TARIFAS_BASE.DEFAULT;

    // Calcular costo por peso (primer kg gratis)
    const kgAdicionales = Math.max(0, peso - 1);
    const costoPeso = kgAdicionales * COSTO_POR_KG;

    // Calcular seguro basado en valor declarado
    const costoSeguro = valorDeclarado * PORCENTAJE_SEGURO;

    // Calcular tarifa total
    const tarifaTotal = Math.round(tarifaBase + costoPeso + costoSeguro);

    // Calcular tiempo estimado de entrega
    let tiempoEstimado;
    if (origenNormalizado === destinoNormalizado) {
      tiempoEstimado = TIEMPOS_ENTREGA.MISMA_CIUDAD;
    } else if (
      [origenNormalizado, destinoNormalizado].every((ciudad) =>
        ['BOGOTA', 'MEDELLIN', 'CALI', 'BARRANQUILLA'].includes(ciudad)
      )
    ) {
      tiempoEstimado = TIEMPOS_ENTREGA.CIUDADES_PRINCIPALES;
    } else {
      tiempoEstimado = TIEMPOS_ENTREGA.OTROS_DESTINOS;
    }

    // Construir respuesta
    const response = {
      tarifa: tarifaTotal,
      moneda: 'COP',
      desglose: {
        tarifaBase,
        costoPeso,
        costoSeguro: Math.round(costoSeguro),
      },
      tiempoEstimadoDias: tiempoEstimado,
      origen: origenNormalizado,
      destino: destinoNormalizado,
      peso,
      valorDeclarado,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al calcular tarifa:', error);
    return NextResponse.json(
      { error: 'Error al calcular la tarifa', details: error.message },
      { status: 500 }
    );
  }
}
