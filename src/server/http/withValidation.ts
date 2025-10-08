import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export function withValidation<T>(schema: ZodSchema<T>, handler: (req: NextRequest, body: T) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body = req.method === 'GET' ? (Object.fromEntries(new URL(req.url).searchParams) as unknown) : await req.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
      }
      return handler(req, parsed.data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return NextResponse.json({ error: 'Bad Request', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
    }
  };
}
