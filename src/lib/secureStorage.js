/**
 * 🔒 Servicio de almacenamiento seguro con cifrado AES
 * Cifra datos sensibles antes de guardarlos en localStorage
 */

import CryptoJS from 'crypto-js';

// Clave de cifrado - DEBE estar en variables de entorno
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY || 'bisonte-default-key-2024-change-in-production';

/**
 * Verifica si la clave de cifrado es segura
 */
const isSecureKey = () => {
  if (ENCRYPTION_KEY === 'bisonte-default-key-2024-change-in-production') {
    console.warn('⚠️ [SecureStorage] Usando clave de cifrado por defecto. Configura NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY en producción.');
    return false;
  }
  return ENCRYPTION_KEY.length >= 32;
};

/**
 * Servicio de almacenamiento seguro
 */
export const SecureStorage = {
  /**
   * Guarda un valor cifrado en localStorage
   */
  setItem: (key, value, options = {}) => {
    try {
      // Validar clave de cifrado en producción
      if (!isSecureKey() && process.env.NODE_ENV === 'production') {
        console.error('❌ [SecureStorage] Clave de cifrado insegura en producción');
      }

      const dataToEncrypt = {
        value: value,
        timestamp: Date.now(),
        expiry: options.ttl ? Date.now() + options.ttl : null
      };

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(dataToEncrypt), 
        ENCRYPTION_KEY
      ).toString();

      localStorage.setItem(key, encrypted);
      console.log(`🔒 [SecureStorage] Guardado cifrado: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ [SecureStorage] Error al guardar ${key}:`, error);
      return false;
    }
  },

  /**
   * Obtiene y descifra un valor de localStorage
   */
  getItem: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        console.error(`❌ [SecureStorage] No se pudo descifrar ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      const data = JSON.parse(decryptedStr);

      // Verificar expiración
      if (data.expiry && Date.now() > data.expiry) {
        console.log(`⏰ [SecureStorage] Dato expirado: ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error(`❌ [SecureStorage] Error al leer ${key}:`, error);
      // Si falla el descifrado, eliminar el dato corrupto
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Elimina un elemento
   */
  removeItem: (key) => {
    localStorage.removeItem(key);
    console.log(`🗑️ [SecureStorage] Eliminado: ${key}`);
  },

  /**
   * Limpia todos los elementos
   */
  clear: () => {
    localStorage.clear();
    console.log(`🧹 [SecureStorage] Storage limpiado completamente`);
  },

  /**
   * Verifica si un elemento existe y no ha expirado
   */
  hasItem: (key) => {
    const value = SecureStorage.getItem(key);
    return value !== null;
  }
};

export default SecureStorage;
