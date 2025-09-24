/**
 * Clean Admin API tests aligned with current implementation at src/app/api/admin/route.js
 * - Mocks Prisma to avoid real DB calls
 * - Verifies GET returns stats and meta
 * - Verifies POST echoes payload
 */

// Mock Prisma client used by the route handler to avoid DB connections
jest.mock('../../src/libs/prisma', () => ({
  __esModule: true,
  default: {
    usuarios: { count: jest.fn().mockResolvedValue(42) },
    historialEnvio: { count: jest.fn().mockResolvedValue(7) },
    contacto: { count: jest.fn().mockResolvedValue(3) },
  },
}));

describe('/api/admin route handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET returns admin dashboard data with stats', async () => {
    const { GET } = await import('../../src/app/api/admin/route.js');
    const res = await GET();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        stats: {
          totalUsuarios: 42,
          totalEnvios: 7,
          totalContactos: 3,
        },
        timestamp: expect.any(String),
        version: expect.any(String),
      },
    });
  });

  test('POST echoes provided payload and succeeds', async () => {
    const { POST } = await import('../../src/app/api/admin/route.js');
    const body = { action: 'ping', meta: { from: 'jest' } };
    const mockReq = { json: async () => body };

    const res = await POST(mockReq);
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      success: true,
      message: expect.any(String),
      data: body,
      timestamp: expect.any(String),
    });
  });

  test('POST returns 500 on invalid JSON body', async () => {
    const { POST } = await import('../../src/app/api/admin/route.js');
    const mockReq = { json: async () => { throw new Error('bad json'); } };
    const res = await POST(mockReq);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toMatchObject({ success: false, error: expect.any(String) });
  });
});
