import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { isPlatform } from '@ionic/react';

const PSEPayment = ({ 
  amount, 
  onPaymentStart, 
  onPaymentComplete, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    document_type: 'CC',
    document_number: '',
    financial_institution: '1040'
  });
  const [loading, setLoading] = useState(false);

  // Lista de bancos PSE más comunes
  const banks = [
    { code: '1040', name: 'Banco Agrario' },
    { code: '1052', name: 'Banco AV Villas' },
    { code: '1032', name: 'Banco de Bogotá' },
    { code: '1002', name: 'Banco de Occidente' },
    { code: '1062', name: 'Banco Falabella' },
    { code: '1012', name: 'Banco GNB Sudameris' },
    { code: '1006', name: 'Banco Itaú' },
    { code: '1014', name: 'Banco Mundo Mujer' },
    { code: '1023', name: 'Banco de Colombia (Bancolombia)' },
    { code: '1051', name: 'Banco Davivienda' },
    { code: '1001', name: 'Banco Popular' },
    { code: '1019', name: 'Banco Colpatria (Scotiabank)' },
    { code: '1066', name: 'Banco Cooperativo Coopcentral' },
    { code: '1558', name: 'BBVA Colombia' }
  ];

  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'PPN', label: 'Pasaporte' },
    { value: 'SSN', label: 'SSN' },
    { value: 'CURP', label: 'CURP' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openExternalBrowser = async (url) => {
    try {
      if (isPlatform('capacitor')) {
        // En dispositivo móvil - abrir navegador externo
        await Browser.open({ url });
        console.log('🌐 Navegador externo abierto para PSE');
      } else {
        // En navegador web - abrir en nueva pestaña
        window.open(url, '_blank', 'noopener,noreferrer');
        console.log('🌐 Nueva pestaña abierta para PSE');
      }
    } catch (error) {
      console.error('❌ Error al abrir navegador:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.document_number) {
      onError && onError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🏦 Iniciando pago PSE...');
      
      if (onPaymentStart) {
        onPaymentStart();
      }

      // Crear pago PSE en el backend
      const response = await fetch('/api/mercadopago/create-pse-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          email: formData.email,
          document_type: formData.document_type,
          document_number: formData.document_number,
          financial_institution: formData.financial_institution,
          description: `Pago Bisonte Logística - $${amount.toLocaleString()}`
        })
      });

      const result = await response.json();
      console.log('📥 Respuesta del backend PSE:', result);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear pago PSE');
      }

      // Guardar payment_id para verificación posterior
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pse_payment_id', result.payment_id);
        sessionStorage.setItem('pse_callback_expected', 'true');
      }

      console.log('🔗 Redirigiendo al banco:', result.external_resource_url);
      
      // Abrir navegador externo para ir al banco
      await openExternalBrowser(result.external_resource_url);

      // En este punto el usuario está en el banco
      // El callback manejará el retorno
      console.log('✅ Usuario redirigido al banco PSE');
      
      if (onPaymentComplete) {
        onPaymentComplete({
          payment_id: result.payment_id,
          status: 'redirected_to_bank'
        });
      }

    } catch (error) {
      console.error('❌ Error en pago PSE:', error);
      
      if (onError) {
        onError(error.message || 'Error al procesar pago PSE');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pse-payment-form bg-white rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🏦 Pagar con PSE
        </h3>
        <p className="text-gray-600 text-sm">
          Serás redirigido al sitio web de tu banco para completar el pago de forma segura
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
          <p className="text-blue-700 text-sm">
            <strong>Monto a pagar:</strong> ${amount?.toLocaleString()} COP
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
            disabled={loading}
          />
        </div>

        {/* Tipo de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento *
          </label>
          <select
            name="document_type"
            value={formData.document_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Número de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Documento *
          </label>
          <input
            type="text"
            name="document_number"
            value={formData.document_number}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="12345678"
            disabled={loading}
          />
        </div>

        {/* Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Banco
          </label>
          <select
            name="financial_institution"
            value={formData.financial_institution}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {banks.map(bank => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        {/* Información importante */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <p className="text-yellow-700 text-xs">
            <strong>Importante:</strong> Serás redirigido al sitio web de tu banco. 
            Una vez completes el pago, regresa a esta aplicación.
          </p>
        </div>

        {/* Botón de pago */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            '🏦 Continuar al Banco'
          )}
        </button>
      </form>
    </div>
  );
};

export default PSEPayment;