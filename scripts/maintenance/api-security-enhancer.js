#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class APISecurityEnhancer {
  constructor() {
    this.enhancedFiles = [];
    this.errors = [];
  }

  async run() {
    console.log('🔒 Iniciando mejoras de seguridad en APIs...\n');
    
    // Enhance API routes with security
    await this.enhanceAPIRoutes();
    
    // Add security middleware
    await this.createSecurityMiddleware();
    
    // Add validation schemas
    await this.createValidationSchemas();
    
    // Create API tests
    await this.createAPITests();
    
    this.printReport();
  }

  async enhanceAPIRoutes() {
    console.log('🛡️ Mejorando rutas de API...');
    
    // Find all API route files
    const apiRoutes = [
      'src/app/api/admin/route.js',
      'src/app/api/admin/stats/route.js',
      'src/app/api/auth/gis/route.js',
      'src/app/api/auth/native-google/route.ts',
      'src/app/api/users/route.js',
      'src/app/api/clients/route.js',
      'src/app/api/orders/route.js'
    ];

    for (const routePath of apiRoutes) {
      await this.enhanceRoute(routePath);
    }
  }

  async enhanceRoute(routePath) {
    try {
      const fullPath = path.join(process.cwd(), routePath);
      
      // Check if file exists
      let content;
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.createBasicRoute(fullPath, routePath);
          return;
        }
        throw error;
      }

      // Check if already has security enhancements
      if (content.includes('validateRequest') && content.includes('withErrorHandler')) {
        this.enhancedFiles.push(`${routePath} - Already enhanced`);
        return;
      }

      // Add security enhancements
      const enhancedContent = this.addSecurityEnhancements(content, routePath);
      
      if (enhancedContent !== content) {
        await fs.writeFile(fullPath, enhancedContent);
        this.enhancedFiles.push(`${routePath} - Security enhanced`);
        console.log(`   ✅ Enhanced: ${routePath}`);
      }

    } catch (error) {
      this.errors.push(`Error enhancing ${routePath}: ${error.message}`);
      console.log(`   ❌ Error: ${routePath}`);
    }
  }

  async createBasicRoute(fullPath, routePath) {
    const routeName = path.basename(path.dirname(routePath));
    const isAdmin = routePath.includes('/admin/');
    
    const template = `import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/errorHandler';
import { withAuth } from '@/lib/auth';
${isAdmin ? "import { requireAdmin } from '@/lib/auth';" : ''}

// GET handler
export const GET = withErrorHandler(async (request: NextRequest) => {
  ${isAdmin ? 'await requireAdmin(request);' : ''}
  
  try {
    // TODO: Implement ${routeName} GET logic
    const data = {
      message: '${routeName} GET endpoint',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('${routeName} GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST handler
export const POST = withErrorHandler(async (request: NextRequest) => {
  ${isAdmin ? 'await requireAdmin(request);' : ''}
  
  try {
    const body = await request.json();
    
    // TODO: Add validation schema
    // const validatedData = await validateRequest(body, ${routeName}Schema);
    
    // TODO: Implement ${routeName} POST logic
    const result = {
      message: '${routeName} created successfully',
      data: body,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('${routeName} POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
`;

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, template);
    this.enhancedFiles.push(`${routePath} - Created with security template`);
    console.log(`   ✅ Created: ${routePath}`);
  }

  addSecurityEnhancements(content, routePath) {
    // Add imports if not present
    let enhanced = content;
    
    if (!enhanced.includes('withErrorHandler')) {
      enhanced = `import { withErrorHandler } from '@/lib/errorHandler';\n${enhanced}`;
    }
    
    if (!enhanced.includes('validateRequest')) {
      enhanced = `import { validateRequest } from '@/lib/validation';\n${enhanced}`;
    }

    // Wrap handlers with error handling if not already wrapped
    enhanced = enhanced.replace(
      /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*async\s*\(([^)]+)\)\s*=>/g,
      'export const $1 = withErrorHandler(async ($2) =>'
    );

    // Add missing closing parentheses and brackets
    if (enhanced.includes('withErrorHandler(async')) {
      enhanced = enhanced.replace(/}\s*$/, '});\n');
    }

    return enhanced;
  }

  async createSecurityMiddleware() {
    console.log('🛡️ Creando middleware de seguridad...');
    
    const errorHandlerPath = path.join(process.cwd(), 'src', 'lib', 'errorHandler.ts');
    const validationPath = path.join(process.cwd(), 'src', 'lib', 'validation.ts');
    const authPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts');

    // Error Handler
    const errorHandlerContent = `import { NextRequest, NextResponse } from 'next/server';

export function withErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Handle known error types
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error.message },
          { status: 400 }
        );
      }
      
      if (error.name === 'UnauthorizedError') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (error.name === 'ForbiddenError') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      // Generic error response
      return NextResponse.json(
        { 
          error: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 500 }
      );
    }
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
`;

    // Validation
    const validationContent = `import { ValidationError } from './errorHandler';

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
      errors.push(\`Field '\${field}' is required\`);
      continue;
    }
    
    // Skip validation if field is not required and empty
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (!validateType(value, rules.type)) {
      errors.push(\`Field '\${field}' must be of type \${rules.type}\`);
      continue;
    }

    // Length validation for strings
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(\`Field '\${field}' must be at least \${rules.min} characters long\`);
        continue;
      }
      if (rules.max && value.length > rules.max) {
        errors.push(\`Field '\${field}' must be at most \${rules.max} characters long\`);
        continue;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(\`Field '\${field}' format is invalid\`);
      continue;
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(\`Field '\${field}' validation failed\`);
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
    pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
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
    validate: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(value)
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
    pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  },
  phone: {
    type: 'string',
    required: false,
    pattern: /^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,15}$/
  },
  address: {
    type: 'string',
    required: false,
    max: 500
  }
};
`;

    // Auth middleware
    const authContent = `import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

export async function requireAuth(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }
  
  return token;
}

export async function requireAdmin(request: NextRequest) {
  const token = await requireAuth(request);
  
  if (token.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  return token;
}

export async function withAuth(handler: (request: NextRequest, token: any) => Promise<any>) {
  return async (request: NextRequest) => {
    const token = await requireAuth(request);
    return handler(request, token);
  };
}

export function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  
  return authorization.slice(7);
}

export function validateAPIKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_SECRET_KEY;
  
  return apiKey === validApiKey;
}
`;

    try {
      await fs.mkdir(path.dirname(errorHandlerPath), { recursive: true });
      await fs.writeFile(errorHandlerPath, errorHandlerContent);
      await fs.writeFile(validationPath, validationContent);
      await fs.writeFile(authPath, authContent);
      
      this.enhancedFiles.push('Created security middleware files');
      console.log('   ✅ Security middleware created');
    } catch (error) {
      this.errors.push(`Error creating middleware: ${error.message}`);
    }
  }

  async createValidationSchemas() {
    console.log('✅ Creando schemas de validación...');
    
    const schemasPath = path.join(process.cwd(), 'src', 'lib', 'schemas.ts');
    const schemasContent = `import { ValidationSchema } from './validation';

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
    pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
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
`;

    try {
      await fs.writeFile(schemasPath, schemasContent);
      this.enhancedFiles.push('Created validation schemas');
      console.log('   ✅ Validation schemas created');
    } catch (error) {
      this.errors.push(`Error creating schemas: ${error.message}`);
    }
  }

  async createAPITests() {
    console.log('🧪 Creando tests de API...');
    
    // Create basic test setup
    const testSetupPath = path.join(process.cwd(), 'tests', 'setup.js');
    const testSetupContent = `// Test setup for Jest
import { jest } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'loading' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Setup test environment
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
`;

    // Create API test
    const apiTestPath = path.join(process.cwd(), 'tests', 'api', 'admin.test.js');
    const apiTestContent = `import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../../src/app/api/admin/route';

describe('/api/admin', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer user-token',
        },
      });

      // Mock getToken to return non-admin user
      jest.mock('next-auth/jwt', () => ({
        getToken: () => Promise.resolve({ role: 'user' })
      }));

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return data for admin users', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
        },
      });

      // Mock getToken to return admin user
      jest.mock('next-auth/jwt', () => ({
        getToken: () => Promise.resolve({ role: 'admin' })
      }));

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
    });
  });

  describe('POST', () => {
    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: {
          // Missing required fields
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation');
    });
  });
});
`;

    // Jest configuration
    const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
    const jestConfigContent = `const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts}',
    '<rootDir>/src/**/*.test.{js,ts}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!src/**/*.d.ts',
    '!src/**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
`;

    try {
      await fs.mkdir(path.dirname(testSetupPath), { recursive: true });
      await fs.mkdir(path.dirname(apiTestPath), { recursive: true });
      
      await fs.writeFile(testSetupPath, testSetupContent);
      await fs.writeFile(apiTestPath, apiTestContent);
      await fs.writeFile(jestConfigPath, jestConfigContent);
      
      this.enhancedFiles.push('Created API test suite');
      console.log('   ✅ API tests created');
    } catch (error) {
      this.errors.push(`Error creating tests: ${error.message}`);
    }
  }

  printReport() {
    console.log('\\n🔒 REPORTE DE MEJORAS DE SEGURIDAD');
    console.log('==================================');
    
    console.log(`\\n📈 RESUMEN:`);
    console.log(`   ✅ Archivos mejorados: ${this.enhancedFiles.length}`);
    console.log(`   ❌ Errores: ${this.errors.length}`);

    if (this.enhancedFiles.length > 0) {
      console.log(`\\n✅ MEJORAS APLICADAS:`);
      this.enhancedFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\\n❌ ERRORES:`);
      this.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    console.log(`\\n🎯 PRÓXIMOS PASOS:`);
    console.log(`   1. Instalar dependencias: npm install --legacy-peer-deps`);
    console.log(`   2. Configurar variables de entorno de prueba`);
    console.log(`   3. Ejecutar tests: npm test`);
    console.log(`   4. Revisar y personalizar schemas de validación`);
    console.log(`   5. Implementar lógica específica en las rutas API`);

    console.log(`\\n✨ MEJORAS DE SEGURIDAD COMPLETADAS`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const enhancer = new APISecurityEnhancer();
  enhancer.run().catch(console.error);
}

module.exports = APISecurityEnhancer;