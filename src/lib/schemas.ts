import { ValidationSchema } from './validation';

// Order management schemas
export const orderSchema: ValidationSchema = {
  clientId: {
    type: 'string',
    required: true
  },
  pickup: {
    type: 'object',
    required: true
  },
  delivery: {
    type: 'object',
    required: true
  },
  package: {
    type: 'object',
    required: true
  },
  notes: {
    type: 'string',
    required: false,
    max: 1000
  }
};

export const deliverySchema: ValidationSchema = {
  orderId: {
    type: 'string',
    required: true
  },
  status: {
    type: 'string',
    required: true,
    validate: (value: string) => ['pending', 'in_transit', 'delivered', 'cancelled'].includes(value)
  },
  location: {
    type: 'object',
    required: false
  },
  notes: {
    type: 'string',
    required: false,
    max: 500
  }
};

export const authSchema: ValidationSchema = {
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: 'string',
    required: true,
    min: 6
  }
};

// Admin schemas
export const adminUserSchema: ValidationSchema = {
  ...authSchema,
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100
  },
  role: {
    type: 'string',
    required: true,
    validate: (value: string) => ['admin', 'operator', 'viewer'].includes(value)
  }
};
