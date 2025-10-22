// Detector automático de entorno para MercadoPago
import { initMercadoPago } from "@mercadopago/sdk-react";

// Función para detectar el entorno automáticamente
const getEnvironmentConfig = () => {
  // Detectar si estamos en el navegador
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProduction = hostname === 'www.bisonteapp.com' || hostname === 'bisonteapp.com';

  console.log('🌐 Detectando entorno:', { hostname, isLocalhost, isProduction });

  if (isLocalhost) {
    // En localhost usar siempre modo test
    return {
      publicKey: 'TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b',
      environment: 'test',
      message: '🧪 Modo TEST detectado (localhost)'
    };
  } else if (isProduction) {
    // En dominio de producción usar credenciales de producción
    return {
      publicKey: 'APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d',
      environment: 'production',
      message: '🚀 Modo PRODUCCIÓN detectado (bisonteapp.com)'
    };
  } else {
    // Dominio desconocido - usar test por seguridad
    return {
      publicKey: 'TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b',
      environment: 'test',
      message: '⚠️ Dominio desconocido - usando modo TEST por seguridad'
    };
  }
};

// Hook personalizado para MercadoPago
export const useMercadoPagoConfig = () => {
  const [config, setConfig] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const envConfig = getEnvironmentConfig();
    
    if (envConfig) {
      console.log(envConfig.message);
      
      try {
        initMercadoPago(envConfig.publicKey, {
          locale: "es-CO"
        });
        
        setConfig(envConfig);
        setIsInitialized(true);
        
        console.log('✅ MercadoPago inicializado:', {
          environment: envConfig.environment,
          publicKey: envConfig.publicKey.substring(0, 20) + '...'
        });
        
      } catch (error) {
        console.error('❌ Error inicializando MercadoPago:', error);
      }
    }
  }, []);

  return {
    config,
    isInitialized,
    environment: config?.environment,
    isTestMode: config?.environment === 'test',
    isProductionMode: config?.environment === 'production'
  };
};

export default getEnvironmentConfig;