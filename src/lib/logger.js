/**
 * 📝 Sistema de logging seguro
 * Previene logging de datos sensibles automáticamente
 */

const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'apiKey', 'api_key',
  'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'privateKey', 'private_key', 'creditCard', 'credit_card', 'cvv', 'ssn',
  'cardNumber', 'card_number', 'securityCode', 'security_code'
];

/**
 * Redacta datos sensibles de un objeto recursivamente
 */
function redactSensitiveData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  const redacted = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sensitive => 
        lowerKey.includes(sensitive)
      );
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object') {
        redacted[key] = redactSensitiveData(data[key]);
      } else {
        redacted[key] = data[key];
      }
    }
  }
  return redacted;
}

/**
 * Formatea el timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Logger seguro
 */
export const Logger = {
  /**
   * Log de información
   */
  info: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`ℹ️ [INFO ${getTimestamp()}] ${message}`, safeData);
    }
  },
  
  /**
   * Log de advertencia
   */
  warn: (message, data = null) => {
    const safeData = data ? redactSensitiveData(data) : '';
    console.warn(`⚠️ [WARN ${getTimestamp()}] ${message}`, safeData);
  },
  
  /**
   * Log de error
   */
  error: (message, error = null) => {
    const safeError = error ? {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name
    } : '';
    
    console.error(`❌ [ERROR ${getTimestamp()}] ${message}`, safeError);
    
    // En producción, enviar a servicio de monitoring (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Ejemplo con Sentry:
      // Sentry.captureException(error, { tags: { message } });
    }
  },
  
  /**
   * Log de éxito
   */
  success: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`✅ [SUCCESS ${getTimestamp()}] ${message}`, safeData);
    }
  },
  
  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`🐛 [DEBUG ${getTimestamp()}] ${message}`, safeData);
    }
  },

  /**
   * Log de operaciones de seguridad
   */
  security: (message, data = null) => {
    const safeData = data ? redactSensitiveData(data) : '';
    console.log(`🔒 [SECURITY ${getTimestamp()}] ${message}`, safeData);
    
    // En producción, siempre enviar logs de seguridad al monitoring
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Ejemplo: enviar a servicio de logs de seguridad
      // SecurityLogger.log({ message, data: safeData, timestamp: Date.now() });
    }
  },

  /**
   * Log de performance
   */
  performance: (message, metrics = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [PERF ${getTimestamp()}] ${message}`, metrics);
    }
  }
};

export default Logger;
