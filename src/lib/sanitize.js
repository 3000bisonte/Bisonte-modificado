/**
 * 🧹 Utilidades de sanitización de inputs
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza texto eliminando HTML y scripts
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return input;
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
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
  if (typeof phone !== 'string') return '';
  
  return phone
    .trim()
    .replace(/[^0-9+]/g, '');
}

/**
 * Sanitiza nombre (solo letras, espacios y acentos)
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  
  return name
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
      } else {
        sanitized[key] = sanitizeText(obj[key]);
      }
    }
  }
  return sanitized;
}
