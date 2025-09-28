// �️ Sistema robusto de validación con Zod - Seguridad mejorada
import { z } from 'zod';
import validator from 'validator';

/**
 * 🔐 Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .max(254, "Email muy largo")
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(1, "Contraseña es requerida")
    .max(128, "Contraseña muy larga"),
    
  idToken: z.string().optional(), // Para Google OAuth
  
  rememberMe: z.boolean().optional().default(false)
});

/**
 * 🆕 Registration form validation schema
 */
export const registerSchema = z.object({
  email: z.string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .max(254, "Email muy largo")
    .transform(val => val.toLowerCase().trim()),
    
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/\d/, "Debe contener al menos un número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Debe contener al menos un carácter especial"),
    
  confirmPassword: z.string(),
  
  nombre: z.string()
    .min(2, "Nombre muy corto")
    .max(100, "Nombre muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo letras y espacios"),
    
  celular: z.string()
    .min(10, "Celular muy corto")
    .max(15, "Celular muy largo")
    .regex(/^\+?[0-9\s-()]+$/, "Formato de celular inválido")
    .optional(),
    
  ciudad: z.string()
    .min(2, "Ciudad muy corta")
    .max(100, "Ciudad muy larga")
    .optional(),
    
  acceptTerms: z.boolean()
    .refine(val => val === true, "Debes aceptar los términos")
    
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

/**
 * 🔄 Password recovery validation schema
 */
export const recoverySchema = z.object({
  email: z.string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .transform(val => val.toLowerCase().trim())
});

/**
 * 🔄 Password reset validation schema
 */
export const resetPasswordSchema = z.object({
  code: z.string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d{6}$/, "Solo números permitidos"),
    
  email: z.string()
    .email("Email inválido")
    .transform(val => val.toLowerCase().trim()),
    
  newPassword: z.string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/\d/, "Debe contener al menos un número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Debe contener al menos un carácter especial"),
    
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmNewPassword"]
});

/**
 * 🔍 Google ID Token validation schema
 */
export const googleIdTokenSchema = z.object({
  idToken: z.string()
    .min(100, "ID Token muy corto")
    .regex(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/, "Formato de JWT inválido"),
    
  callbackUrl: z.string().url().optional()
});

/**
 * 📧 Email validation (standalone)
 */
export const emailSchema = z.string()
  .min(1, "Email es requerido")
  .email("Formato de email inválido")
  .max(254, "Email muy largo")
  .transform(val => val.toLowerCase().trim());

/**
 * 📱 Phone validation (standalone)
 */
export const phoneSchema = z.string()
  .min(10, "Teléfono muy corto")
  .max(15, "Teléfono muy largo")
  .regex(/^\+?[0-9\s-()]+$/, "Formato de teléfono inválido");

/**
 * 🛡️ Validate request data against schema
 * @param {object} schema - Zod schema
 * @param {object} data - Data to validate
 * @returns {object} Validation result
 */
export function validateSchema(schema, data) {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ field: 'general', message: 'Error de validación desconocido' }]
    };
  }
}

/**
 * 📊 Get validation error messages in Spanish
 * @param {array} errors - Zod error array
 * @returns {object} Formatted errors by field
 */
export function formatValidationErrors(errors) {
  const formatted = {};
  
  errors.forEach(error => {
    const field = error.field || 'general';
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(error.message);
  });
  
  return formatted;
}

// Export common validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9\s-()]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
  NUMBERS_ONLY: /^\d+$/,
  LETTERS_ONLY: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
};

/**
 * 🛡️ Clase para manejo centralizado de validaciones con seguridad mejorada
 */
export class ValidationService {
  /**
   * Validar datos contra un schema con manejo de errores robusto
   */
  static validate(schema, data, options = {}) {
    const { 
      stripUnknown = true, 
      errorMessage = 'Datos inválidos',
      sanitize = true 
    } = options;

    try {
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return {
          success: false,
          errors,
          message: errorMessage,
          details: this.formatErrorMessage(errors)
        };
      }

      // Sanitizar datos si está habilitado
      const finalData = sanitize ? this.sanitizeObject(result.data) : result.data;

      return {
        success: true,
        data: finalData
      };
    } catch (error) {
      console.error('[ValidationService] Validation error:', error);
      
      return {
        success: false,
        errors: [{ field: 'general', message: 'Error de validación interno' }],
        message: 'Error interno de validación'
      };
    }
  }

  /**
   * Formatear mensaje de error para el usuario
   */
  static formatErrorMessage(errors) {
    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Se encontraron ${errors.length} errores: ${errors.map(e => e.message).join(', ')}`;
  }

  /**
   * Validar y sanitizar datos de entrada para APIs
   */
  static async validateApiInput(req, schema, options = {}) {
    try {
      const body = await req.json();
      return this.validate(schema, body, options);
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'body', message: 'JSON inválido' }],
        message: 'Formato de datos incorrecto'
      };
    }
  }

  /**
   * Sanitizar cadenas para prevenir XSS
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Escapar HTML y trim
    return validator.escape(str.trim());
  }

  /**
   * Validar y sanitizar múltiples campos recursivamente
   */
  static sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validar parámetros de consulta
   */
  static validateQuery(searchParams, schema, options = {}) {
    const queryObject = {};
    
    for (const [key, value] of searchParams.entries()) {
      queryObject[key] = value;
    }

    return this.validate(schema, queryObject, options);
  }

  /**
   * Validar archivos subidos
   */
  static validateFile(file, allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024) {
    const errors = [];

    if (!file) {
      errors.push({ field: 'file', message: 'Archivo requerido' });
      return { success: false, errors };
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push({ 
        field: 'file', 
        message: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}` 
      });
    }

    if (file.size > maxSize) {
      errors.push({ 
        field: 'file', 
        message: `Archivo muy grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB` 
      });
    }

    return errors.length > 0 ? { success: false, errors } : { success: true };
  }
}

// Middleware de validación mejorado para API routes
export function withValidation(schema, options = {}) {
  return function(handler) {
    return async function(req, ...args) {
      // Validar datos de entrada
      const validation = await ValidationService.validateApiInput(req, schema, options);
      
      if (!validation.success) {
        return Response.json(
          { 
            error: validation.message,
            details: validation.errors,
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }

      // Añadir datos validados al request
      req.validatedData = validation.data;
      
      return handler(req, ...args);
    };
  };
}

// Esquemas adicionales para seguridad mejorada

// Esquema para paginación segura
export const paginationSchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Página debe ser mayor a 0'),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 10)
    .refine(val => val > 0 && val <= 100, 'Límite debe estar entre 1 y 100'),
  sortBy: z.string().optional().max(50),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Esquema para filtros de búsqueda
export const searchFilterSchema = z.object({
  search: z.string().optional().max(100).transform(val => val ? validator.escape(val.trim()) : undefined),
  estado: z.string().optional().max(20),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional()
});

// Esquema para IDs seguros
export const idSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0, 'ID debe ser un número positivo')
});