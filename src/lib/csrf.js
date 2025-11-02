/**
 * 🛡️ Utilidades para protección CSRF
 * Previene ataques Cross-Site Request Forgery
 */

/**
 * Genera un token CSRF único usando Web Crypto API
 */
export function generateCsrfToken() {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback para entornos sin crypto
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Verifica que el token CSRF sea válido
 * Usa comparación de tiempo constante para prevenir timing attacks
 */
export function verifyCsrfToken(token, storedToken) {
  if (!token || !storedToken) {
    return false;
  }
  
  // Comparación constante en tiempo para prevenir timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Almacena el token CSRF en sessionStorage
 */
export function storeCsrfToken(token) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrfToken', token);
    sessionStorage.setItem('csrfTokenTimestamp', Date.now().toString());
  }
}

/**
 * Obtiene el token CSRF almacenado
 */
export function getCsrfToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = sessionStorage.getItem('csrfToken');
  const timestamp = sessionStorage.getItem('csrfTokenTimestamp');
  
  if (!token || !timestamp) {
    return null;
  }
  
  // Verificar que el token no haya expirado (1 hora)
  const age = Date.now() - parseInt(timestamp);
  const MAX_AGE = 60 * 60 * 1000; // 1 hora
  
  if (age > MAX_AGE) {
    sessionStorage.removeItem('csrfToken');
    sessionStorage.removeItem('csrfTokenTimestamp');
    return null;
  }
  
  return token;
}

/**
 * Genera y almacena un nuevo token CSRF
 */
export function initCsrfToken() {
  const token = generateCsrfToken();
  storeCsrfToken(token);
  return token;
}

/**
 * Limpia el token CSRF almacenado
 */
export function clearCsrfToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('csrfToken');
    sessionStorage.removeItem('csrfTokenTimestamp');
  }
}
