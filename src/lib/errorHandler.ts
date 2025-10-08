import { NextRequest, NextResponse } from 'next/server';

export function withErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error: unknown) {
      console.error('API Error:', error);
      
      // Handle known error types
      if (error instanceof Error) {
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

        // Generic error response with message
        return NextResponse.json(
          { 
            error: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
          },
          { status: 500 }
        );
      }

      // Non-Error type
      return NextResponse.json(
        { error: 'Internal server error' },
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
