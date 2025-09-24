/**
 * Tests for /api/envios
 * - Mocks Prisma to avoid DB
 * - Verifies GET returns success and data array
 */

jest.mock('../../src/libs/prisma', () => ({
  __esModule: true,
  default: {
    historialEnvio: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, NumeroGuia: 'G-1', Estado: 'Enviado', FechaSolicitud: new Date(), usuario: { nombre: 'U1', email: 'u1@test.com', celular: '300' } },
        { id: 2, NumeroGuia: 'G-2', Estado: 'Entregado', FechaSolicitud: new Date(), usuario: { nombre: 'U2', email: 'u2@test.com', celular: '301' } },
      ]),
    },
  },
}));

describe.skip('/api/envios route', () => {
  test('GET returns list of envios', async () => {
  const { GET } = await import('@/app/api/envios/route.js');
    const res = await GET();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ success: true, data: expect.any(Array) });
    expect(json.data.length).toBeGreaterThan(0);
  });
});
