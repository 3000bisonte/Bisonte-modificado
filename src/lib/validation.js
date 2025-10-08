import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Email no válido')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres')
});

export const registerSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string()
    .trim()
    .email('Email no válido')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos').optional()
});

export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {return obj;}
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function validateApiInput(schema, data) {
  try {
    const sanitizedData = sanitizeObject(data);
    const validatedData = schema.parse(sanitizedData);
    
    return {
      success: true,
      data: validatedData,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: 'Datos no válidos',
        details: error.errors || [{ message: error.message }]
      }
    };
  }
}
