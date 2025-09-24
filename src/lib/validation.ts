import { ValidationError } from './errorHandler';

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    validate?: (value: any) => boolean;
  };
}

export async function validateRequest(data: any, schema: ValidationSchema): Promise<any> {
  const errors: string[] = [];
  const validated: any = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`);
      continue;
    }
    
    // Skip validation if field is not required and empty
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (!validateType(value, rules.type)) {
      errors.push(`Field '${field}' must be of type ${rules.type}`);
      continue;
    }

    // Length validation for strings
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min} characters long`);
        continue;
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`Field '${field}' must be at most ${rules.max} characters long`);
        continue;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`Field '${field}' format is invalid`);
      continue;
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(`Field '${field}' validation failed`);
      continue;
    }

    validated[field] = value;
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  return validated;
}

function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
}

// Common schemas
export const userSchema: ValidationSchema = {
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100
  },
  password: {
    type: 'string',
    required: true,
    min: 8,
    validate: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)
  }
};

export const clientSchema: ValidationSchema = {
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100
  },
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: 'string',
    required: false,
    pattern: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
  },
  address: {
    type: 'string',
    required: false,
    max: 500
  }
};
