// 📋 Schema validation for authentication forms and APIs
import { z } from 'zod';

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