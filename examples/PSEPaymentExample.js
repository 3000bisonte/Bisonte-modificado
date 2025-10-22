// Ejemplo de cómo usar el componente PSEPayment en tu aplicación

import React, { useState } from 'react';
import PSEPayment from '../components/PSEPayment';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  
  // Datos del pedido/cotización
  const orderAmount = 50000; // $50,000 COP

  const handlePaymentStart = () => {
    console.log('🚀 Iniciando proceso de pago PSE...');
    setPaymentStatus('processing');
  };

  const handlePaymentComplete = (result) => {
    console.log('✅ Pago completado:', result);
    
    if (result.status === 'redirected_to_bank') {
      setPaymentStatus('redirected');
      // Usuario fue redirigido al banco
      // El callback manejará el retorno
    }
  };

  const handlePaymentError = (error) => {
    console.error('❌ Error en pago PSE:', error);
    setPaymentStatus('error');
    alert(`Error en el pago: ${error}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Procesar Pago</h1>
      
      {/* Selector de método de pago */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Selecciona método de pago:</h2>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="payment_method"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            💳 Tarjeta de Crédito/Débito
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="payment_method"
              value="pse"
              checked={paymentMethod === 'pse'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            🏦 PSE (Débito a cuenta bancaria)
          </label>
        </div>
      </div>

      {/* Mostrar componente PSE si está seleccionado */}
      {paymentMethod === 'pse' && (
        <PSEPayment
          amount={orderAmount}
          onPaymentStart={handlePaymentStart}
          onPaymentComplete={handlePaymentComplete}
          onError={handlePaymentError}
        />
      )}

      {/* Mostrar estado del pago */}
      {paymentStatus && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Estado del Pago:</h3>
          <div className="text-sm">
            {paymentStatus === 'processing' && (
              <span className="text-blue-600">🔄 Procesando pago...</span>
            )}
            {paymentStatus === 'redirected' && (
              <span className="text-yellow-600">
                🌐 Redirigido al banco. Completa el pago y regresa a la app.
              </span>
            )}
            {paymentStatus === 'error' && (
              <span className="text-red-600">❌ Error en el pago</span>
            )}
          </div>
        </div>
      )}

      {/* Información importante */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          📋 Flujo de Pago PSE:
        </h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Completa el formulario con tus datos</li>
          <li>2. Serás redirigido al sitio web de tu banco</li>
          <li>3. Autoriza el pago en el sitio de tu banco</li>
          <li>4. Regresa automáticamente a la aplicación</li>
          <li>5. Verifica el estado de tu pago</li>
        </ol>
      </div>
    </div>
  );
};

export default PaymentPage;