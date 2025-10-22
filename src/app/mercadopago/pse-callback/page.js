'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const PSECallback = () => {
  const [status, setStatus] = useState('loading');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 Verificando estado del pago PSE...');
        
        // Obtener parámetros de la URL del callback
        const collection_id = searchParams.get('collection_id');
        const collection_status = searchParams.get('collection_status');
        const payment_id = searchParams.get('payment_id');
        const status_param = searchParams.get('status');
        const external_reference = searchParams.get('external_reference');

        console.log('📋 Parámetros del callback:', {
          collection_id,
          collection_status,
          payment_id,
          status_param,
          external_reference
        });

        // Obtener payment_id de session storage si no viene en URL
        const stored_payment_id = sessionStorage.getItem('pse_payment_id');
        const final_payment_id = payment_id || collection_id || stored_payment_id;

        if (!final_payment_id) {
          throw new Error('No se pudo identificar el pago');
        }

        // Verificar estado del pago en el backend
        const response = await fetch(`/api/mercadopago/verify-payment/${final_payment_id}`);
        const result = await response.json();

        console.log('📥 Resultado de la verificación:', result);

        if (!result.success) {
          throw new Error(result.error || 'Error al verificar el pago');
        }

        setPaymentInfo({
          id: final_payment_id,
          status: result.payment.status,
          status_detail: result.payment.status_detail,
          amount: result.payment.transaction_amount,
          date: result.payment.date_created
        });

        // Determinar estado final
        if (result.payment.status === 'approved') {
          setStatus('success');
          // Limpiar session storage
          sessionStorage.removeItem('pse_payment_id');
          sessionStorage.removeItem('pse_callback_expected');
        } else if (result.payment.status === 'pending') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }

      } catch (error) {
        console.error('❌ Error en callback PSE:', error);
        setError(error.message);
        setStatus('error');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleReturnToApp = () => {
    // Redirigir según el estado del pago
    if (status === 'success') {
      router.push('/dashboard?payment_success=true');
    } else {
      router.push('/cotizar?payment_failed=true');
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        );
      case 'success':
        return (
          <div className="bg-green-100 rounded-full p-4 mx-auto w-fit">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="bg-yellow-100 rounded-full p-4 mx-auto w-fit">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'failed':
      case 'error':
        return (
          <div className="bg-red-100 rounded-full p-4 mx-auto w-fit">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'loading':
        return {
          title: 'Verificando pago...',
          message: 'Por favor espera mientras verificamos tu pago PSE',
          color: 'text-blue-600'
        };
      case 'success':
        return {
          title: '¡Pago Exitoso!',
          message: 'Tu pago PSE ha sido procesado correctamente',
          color: 'text-green-600'
        };
      case 'pending':
        return {
          title: 'Pago Pendiente',
          message: 'Tu pago PSE está siendo procesado por el banco. Recibirás una confirmación pronto.',
          color: 'text-yellow-600'
        };
      case 'failed':
        return {
          title: 'Pago Fallido',
          message: 'No se pudo procesar tu pago PSE. Puedes intentar nuevamente.',
          color: 'text-red-600'
        };
      case 'error':
        return {
          title: 'Error de Verificación',
          message: error || 'Ocurrió un error al verificar tu pago',
          color: 'text-red-600'
        };
    }
  };

  const statusMsg = renderStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Icono de estado */}
          <div className="mb-6">
            {renderStatusIcon()}
          </div>

          {/* Título y mensaje */}
          <div className="text-center mb-6">
            <h2 className={`text-xl font-bold ${statusMsg.color} mb-2`}>
              {statusMsg.title}
            </h2>
            <p className="text-gray-600 text-sm">
              {statusMsg.message}
            </p>
          </div>

          {/* Información del pago */}
          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Detalles del Pago
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>ID de Pago:</span>
                  <span className="font-mono">{paymentInfo.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span>${paymentInfo.amount?.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="capitalize">{paymentInfo.status}</span>
                </div>
                {paymentInfo.status_detail && (
                  <div className="flex justify-between">
                    <span>Detalle:</span>
                    <span className="capitalize">{paymentInfo.status_detail}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-3">
            <button
              onClick={handleReturnToApp}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a la Aplicación
            </button>

            {(status === 'failed' || status === 'error') && (
              <button
                onClick={() => router.push('/cotizar')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Intentar Otro Pago
              </button>
            )}
          </div>

          {/* Footer informativo */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Si tienes preguntas sobre tu pago, contacta nuestro soporte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PSECallback;