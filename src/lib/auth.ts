import { NextRequest } from 'next/server';
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

export function withAuth(handler: (request: NextRequest, token: unknown) => Promise<unknown>) {
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
