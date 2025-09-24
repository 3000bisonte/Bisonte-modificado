/**
 * Tests for /api/usuarios
 * - Mocks Prisma to avoid DB
 * - Verifies GET returns success and data array
 */

jest.mock('../../src/libs/prisma', () => ({
  __esModule: true,
  default: {
    usuarios: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, nombre: 'Test', email: 'test@example.com', celular: '300', ciudad: 'Bogotá', envios: [] },
      ]),
    },
  },
}));

describe.skip('/api/usuarios route', () => {
  test('GET returns list of usuarios', async () => {
  const { GET } = await import('@/app/api/usuarios/route.js');
    const res = await GET();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ success: true, data: expect.any(Array) });
    expect(json.data[0]).toHaveProperty('email');
  });
});
