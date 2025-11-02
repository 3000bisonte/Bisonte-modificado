/**
 * ⏰ Storage temporal con expiración automática
 * Útil para datos de registro, recuperación de contraseña, etc.
 */

export const TemporaryStorage = {
  /**
   * Guarda un valor con tiempo de expiración
   */
  set: (key, value, ttlMinutes = 5) => {
    const item = {
      value: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    try {
      sessionStorage.setItem(key, JSON.stringify(item));
      console.log(`⏰ [TempStorage] Guardado con TTL de ${ttlMinutes}min: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ [TempStorage] Error guardando ${key}:`, error);
      return false;
    }
  },
  
  /**
   * Obtiene un valor si no ha expirado
   */
  get: (key) => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      const now = Date.now();
      
      if (now > item.expiresAt) {
        console.log(`⏰ [TempStorage] Expirado: ${key}`);
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error(`❌ [TempStorage] Error leyendo ${key}:`, error);
      sessionStorage.removeItem(key);
      return null;
    }
  },
  
  /**
   * Verifica si un valor existe y no ha expirado
   */
  has: (key) => {
    return TemporaryStorage.get(key) !== null;
  },
  
  /**
   * Elimina un valor
   */
  remove: (key) => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ [TempStorage] Eliminado: ${key}`);
  },
  
  /**
   * Limpia todos los valores expirados
   */
  cleanup: () => {
    let cleaned = 0;
    const now = Date.now();
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      
      try {
        const itemStr = sessionStorage.getItem(key);
        const item = JSON.parse(itemStr);
        
        if (item.expiresAt && now > item.expiresAt) {
          sessionStorage.removeItem(key);
          cleaned++;
          i--;
        }
      } catch (error) {
        // Item no es del formato temporal, ignorar
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [TempStorage] Limpiados ${cleaned} items expirados`);
    }
  },
  
  /**
   * Obtiene el tiempo restante en milisegundos
   */
  getTimeRemaining: (key) => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return 0;
      
      const item = JSON.parse(itemStr);
      const remaining = item.expiresAt - Date.now();
      
      return Math.max(0, remaining);
    } catch (error) {
      return 0;
    }
  }
};

// Ejecutar cleanup periódicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    TemporaryStorage.cleanup();
  }, 60 * 1000); // Cada minuto
}

export default TemporaryStorage;
