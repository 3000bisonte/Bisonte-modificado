/**
 * 🧹 Utilidades de sanitización de inputs
 */

/**
 * Sanitiza texto eliminando HTML y scripts
 * Solo funciona en el cliente para evitar problemas de build
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return input;
  if (typeof window === 'undefined') return input; // Skip en servidor
  
  // Sanitización básica sin DOMPurify para evitar errores de build
  return input
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+\s*=/gi, '') // Eliminar event handlers
    .trim();
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitiza número de teléfono
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    // Convertir a string si es número
    if (typeof phone === 'number') {
      return String(phone);
    }
    return '';
  }
  
  return phone
    .trim()
    .replace(/[^0-9+]/g, '');
}

/**
 * Sanitiza nombre (solo letras, espacios y acentos)
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  
  // Primero eliminar cualquier tag HTML completamente
  const withoutTags = name.replace(/<[^>]*>/g, '');
  
  return withoutTags
    .trim()
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Escapa caracteres HTML
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitiza objeto completo recursivamente
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeText(obj);
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else if (key === 'nombre' || key === 'ciudad') {
        sanitized[key] = sanitizeName(obj[key]);
      } else if (key === 'email') {
        sanitized[key] = sanitizeEmail(obj[key]);
      } else if (key === 'celular' || key === 'telefono') {
        sanitized[key] = sanitizePhone(obj[key]);
      } else {
        sanitized[key] = sanitizeText(obj[key]);
      }
    }
  }
  return sanitized;
}
