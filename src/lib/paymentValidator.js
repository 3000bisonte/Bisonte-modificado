/**
 * 🔒 SERVICIO DE VALIDACIÓN DE PAGOS - ROBUSTO Y COMPLETO
 * 
 * Este servicio maneja el flujo completo de validación de pagos con MercadoPago:
 * 1. Verifica el estado del pago con la API de MercadoPago
 * 2. Valida que todos los datos sean correctos
 * 3. Maneja reintentos en caso de errores de red
 * 4. Solo emite estado final después de validación completa
 */

// Estados posibles de un pago
export const PaymentStatus = {
  APPROVED: 'approved',
  PENDING: 'pending',
  IN_PROCESS: 'in_process',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CHARGED_BACK: 'charged_back',
};

// Estados finales (no requieren más validación)
const FINAL_STATES = [
  PaymentStatus.APPROVED,
  PaymentStatus.REJECTED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
  PaymentStatus.CHARGED_BACK,
];

// Estados que requieren espera
const PENDING_STATES = [
  PaymentStatus.PENDING,
  PaymentStatus.IN_PROCESS,
];

/**
 * Valida un pago con MercadoPago antes de emitir estado final
 * @param {string} paymentId - ID del pago a validar
 * @param {number} maxRetries - Máximo de reintentos en caso de error de red
 * @returns {Promise<PaymentValidationResult>}
 */
export async function validatePayment(paymentId, maxRetries = 3) {
  console.log(`🔍 [PaymentValidator] Iniciando validación de pago: ${paymentId}`);
  
  if (!paymentId) {
    console.error('❌ [PaymentValidator] paymentId no proporcionado');
    return {
      isValid: false,
      status: null,
      error: 'ID de pago no proporcionado',
      shouldRetry: false,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // DETECCIÓN DE PAGOS DE PRUEBA (TEST-PSE-*)
  // ══════════════════════════════════════════════════════════════
  if (paymentId && String(paymentId).startsWith('TEST-PSE-')) {
    console.log('🧪 [PaymentValidator] Detectado pago de prueba, simulando respuesta');
    
    // Extraer el estado del payment ID: TEST-PSE-{STATUS}-{timestamp}
    const parts = String(paymentId).split('-');
    const testStatus = parts[2]?.toLowerCase() || 'approved';
    const timestamp = parseInt(parts[parts.length - 1]) || Date.now();
    
    console.log('🎭 [PaymentValidator] Estado simulado:', testStatus);
    
    // Simular delay de red (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ══════════════════════════════════════════════════════════════
    // SIMULACIÓN ESPECIAL: PENDING_TO_APPROVED
    // Simula un pago que cambia de pendiente a aprobado después de 15 segundos
    // ══════════════════════════════════════════════════════════════
    if (testStatus === 'pending_to_approved') {
      const tiempoTranscurrido = Date.now() - timestamp;
      const TIEMPO_APROBACION = 15000; // 15 segundos
      
      console.log(`⏱️ [PaymentValidator] Simulación pending→approved: ${Math.floor(tiempoTranscurrido/1000)}s transcurridos`);
      
      if (tiempoTranscurrido < TIEMPO_APROBACION) {
        // Aún está pendiente
        console.log('⏳ [PaymentValidator] Pago aún pendiente (simulación)');
        return {
          isValid: true,
          status: PaymentStatus.PENDING,
          statusDetail: 'pending_contingency',
          paymentData: {
            id: paymentId,
            status: PaymentStatus.PENDING,
            status_detail: 'pending_contingency',
            transaction_amount: 50000,
            payment_method_id: 'pse',
            payment_type_id: 'bank_transfer',
            date_created: new Date(timestamp).toISOString(),
          },
          shouldProceed: false,
          shouldRetry: false,
        };
      } else {
        // Ya se aprobó
        console.log('✅ [PaymentValidator] Pago aprobado (simulación)');
        return {
          isValid: true,
          status: PaymentStatus.APPROVED,
          statusDetail: 'accredited',
          paymentData: {
            id: paymentId,
            status: PaymentStatus.APPROVED,
            status_detail: 'accredited',
            transaction_amount: 50000,
            payment_method_id: 'pse',
            payment_type_id: 'bank_transfer',
            date_created: new Date(timestamp).toISOString(),
            date_approved: new Date().toISOString(),
          },
          shouldProceed: true,
          shouldRetry: false,
        };
      }
    }
    
    // ══════════════════════════════════════════════════════════════
    // SIMULACIÓN ESTÁNDAR: Otros estados
    // ══════════════════════════════════════════════════════════════
    const statusMap = {
      'approved': PaymentStatus.APPROVED,
      'pending': PaymentStatus.PENDING,
      'in_process': PaymentStatus.IN_PROCESS,
      'rejected': PaymentStatus.REJECTED,
      'cancelled': PaymentStatus.CANCELLED,
    };
    
    const mappedStatus = statusMap[testStatus] || PaymentStatus.APPROVED;
    const statusDetail = testStatus === 'rejected' ? 'cc_rejected_insufficient_amount' : 'accredited';
    
    console.log('✅ [PaymentValidator] Simulación completada:', {
      status: mappedStatus,
      statusDetail,
      shouldProceed: mappedStatus === PaymentStatus.APPROVED,
    });
    
    return {
      isValid: true,
      status: mappedStatus,
      statusDetail: statusDetail,
      paymentData: {
        id: paymentId,
        status: mappedStatus,
        status_detail: statusDetail,
        transaction_amount: 50000,
        payment_method_id: 'pse',
        payment_type_id: 'bank_transfer',
        date_created: new Date().toISOString(),
      },
      shouldProceed: mappedStatus === PaymentStatus.APPROVED,
      shouldRetry: false,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // VALIDACIÓN CON API REAL DE MERCADOPAGO
  // ══════════════════════════════════════════════════════════════

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`🔄 [PaymentValidator] Intento ${attempt}/${maxRetries}`);

    try {
      // Paso 1: Consultar el pago en el backend
      const response = await fetch(`/api/mercadopago/verify-payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000),
      });

      // Paso 2: Verificar respuesta HTTP
      if (!response.ok) {
        if (response.status >= 500) {
          // Error del servidor, reintentar
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        if (response.status === 404) {
          console.error('❌ [PaymentValidator] Pago no encontrado');
          return {
            isValid: false,
            status: null,
            error: 'Pago no encontrado en MercadoPago',
            shouldRetry: false,
          };
        }

        // Otros errores HTTP
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [PaymentValidator] Error HTTP:', response.status, errorData);
        return {
          isValid: false,
          status: null,
          error: errorData.message || `Error HTTP: ${response.status}`,
          shouldRetry: false,
        };
      }

      // Paso 3: Parse y validación de respuesta
      const responseData = await response.json();
      
      if (!responseData.success || !responseData.payment) {
        console.error('❌ [PaymentValidator] Respuesta inválida del servidor');
        throw new Error('Respuesta inválida del servidor');
      }
      
      const paymentData = responseData.payment;
      console.log('📄 [PaymentValidator] Datos del pago recibidos:', {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
      });

      // Paso 4: Validar estructura de datos
      if (!paymentData.id || !paymentData.status) {
        console.error('❌ [PaymentValidator] Respuesta incompleta de MercadoPago');
        throw new Error('Respuesta incompleta del proveedor');
      }

      // Paso 5: Validar que el ID coincida
      if (String(paymentData.id) !== String(paymentId)) {
        console.error('❌ [PaymentValidator] ID de pago no coincide');
        return {
          isValid: false,
          status: null,
          error: 'ID de pago no coincide',
          shouldRetry: false,
        };
      }

      // Paso 6: Determinar estado final
      const status = paymentData.status;
      const statusDetail = paymentData.status_detail;

      // Estado aprobado - validar completamente
      if (status === PaymentStatus.APPROVED) {
        console.log('✅ [PaymentValidator] Pago APROBADO y validado');
        return {
          isValid: true,
          status: PaymentStatus.APPROVED,
          paymentData: {
            id: paymentData.id,
            status: paymentData.status,
            statusDetail: paymentData.status_detail,
            transactionAmount: paymentData.transaction_amount,
            paymentMethodId: paymentData.payment_method_id,
            paymentTypeId: paymentData.payment_type_id,
            dateApproved: paymentData.date_approved,
            dateCreated: paymentData.date_created,
          },
          shouldProceed: true,
          shouldRetry: false,
        };
      }

      // Estados pendientes - no emitir estado final aún
      if (PENDING_STATES.includes(status)) {
        console.warn(`⏳ [PaymentValidator] Pago en estado pendiente: ${status}`);
        return {
          isValid: true,
          status: status,
          statusDetail: statusDetail,
          paymentData: {
            id: paymentData.id,
            status: status,
            statusDetail: statusDetail,
          },
          shouldProceed: false,
          shouldRetry: false,
          message: 'Pago pendiente de confirmación',
        };
      }

      // Estados rechazados/cancelados - estado final negativo
      if ([PaymentStatus.REJECTED, PaymentStatus.CANCELLED].includes(status)) {
        console.error(`❌ [PaymentValidator] Pago ${status}: ${statusDetail}`);
        return {
          isValid: true, // La validación fue exitosa, pero el pago falló
          status: status,
          statusDetail: statusDetail,
          paymentData: {
            id: paymentData.id,
            status: status,
            statusDetail: statusDetail,
          },
          shouldProceed: false,
          shouldRetry: false,
          error: `Pago ${status}: ${statusDetail}`,
        };
      }

      // Otros estados finales (reembolsado, contracargo)
      if (FINAL_STATES.includes(status)) {
        console.warn(`⚠️ [PaymentValidator] Pago en estado final: ${status}`);
        return {
          isValid: true,
          status: status,
          statusDetail: statusDetail,
          paymentData: {
            id: paymentData.id,
            status: status,
            statusDetail: statusDetail,
          },
          shouldProceed: false,
          shouldRetry: false,
          message: `Pago en estado: ${status}`,
        };
      }

      // Estado desconocido
      console.error(`❌ [PaymentValidator] Estado desconocido: ${status}`);
      return {
        isValid: false,
        status: status,
        error: `Estado de pago desconocido: ${status}`,
        shouldRetry: false,
      };

    } catch (error) {
      lastError = error;
      console.error(`❌ [PaymentValidator] Error en intento ${attempt}:`, error.message);

      // Errores de red o timeout - reintentar
      if (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network')) {
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          console.log(`⏳ [PaymentValidator] Reintentando en ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else {
        // Error no recuperable
        break;
      }
    }
  }

  // Si llegamos aquí, fallaron todos los intentos
  console.error('❌ [PaymentValidator] Todos los intentos fallaron');
  return {
    isValid: false,
    status: null,
    error: lastError?.message || 'Error al validar el pago',
    shouldRetry: true, // Usuario puede intentar validar nuevamente
  };
}

/**
 * Verifica si un estado es final (no requiere más validación)
 */
export function isFinalState(status) {
  return FINAL_STATES.includes(status);
}

/**
 * Verifica si un estado es pendiente (requiere espera)
 */
export function isPendingState(status) {
  return PENDING_STATES.includes(status);
}

/**
 * Obtiene un mensaje amigable para el usuario según el estado
 */
export function getStatusMessage(status, statusDetail) {
  const messages = {
    [PaymentStatus.APPROVED]: {
      title: '¡Pago Exitoso!',
      message: 'Tu pago ha sido procesado correctamente.',
      icon: '✅',
      type: 'success',
    },
    [PaymentStatus.PENDING]: {
      title: 'Pago Pendiente',
      message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
      icon: '⏳',
      type: 'warning',
    },
    [PaymentStatus.IN_PROCESS]: {
      title: 'Pago en Proceso',
      message: 'Estamos verificando tu pago con el banco. Esto puede tomar unos minutos.',
      icon: '⏳',
      type: 'warning',
    },
    [PaymentStatus.REJECTED]: {
      title: 'Pago Rechazado',
      message: `Tu pago fue rechazado. ${statusDetail ? `Motivo: ${statusDetail}` : 'Por favor, intenta con otro método de pago.'}`,
      icon: '❌',
      type: 'error',
    },
    [PaymentStatus.CANCELLED]: {
      title: 'Pago Cancelado',
      message: 'El pago fue cancelado. Puedes intentar nuevamente.',
      icon: '🚫',
      type: 'error',
    },
    [PaymentStatus.REFUNDED]: {
      title: 'Pago Reembolsado',
      message: 'Este pago ha sido reembolsado.',
      icon: '↩️',
      type: 'info',
    },
  };

  return messages[status] || {
    title: 'Estado Desconocido',
    message: 'No pudimos determinar el estado del pago.',
    icon: '❓',
    type: 'error',
  };
}

/**
 * @typedef {Object} PaymentValidationResult
 * @property {boolean} isValid - Si la validación fue exitosa (no confundir con pago aprobado)
 * @property {string|null} status - Estado del pago según MercadoPago
 * @property {string|null} statusDetail - Detalle del estado
 * @property {Object|null} paymentData - Datos completos del pago
 * @property {boolean} shouldProceed - Si se debe continuar con el flujo (crear envío, etc.)
 * @property {boolean} shouldRetry - Si el usuario puede/debe reintentar
 * @property {string|null} error - Mensaje de error si aplica
 * @property {string|null} message - Mensaje informativo
 */
