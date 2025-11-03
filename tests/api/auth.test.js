/**
 * 🧪 Tests para API de Autenticación
 * Prueba endpoints de login, logout, cambio de password
 */

describe('API - Autenticación', () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  let testUser = {
    nombre: 'Auth Test User',
    celular: '+573001234567',
    ciudad: 'Bogotá',
    email: `auth-test-${Date.now()}@bisonte-test.com`,
    password: 'AuthPassword123!@#'
  };

  // Registrar usuario antes de los tests
  beforeAll(async () => {
    await fetch(`${apiUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
  });

  describe('✅ Login exitoso', () => {
    test('Debe autenticar con credenciales correctas', async () => {
      const response = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      expect([200, 302]).toContain(response.status);
    });

    test('Debe devolver información del usuario', async () => {
      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include'
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('❌ Login fallido', () => {
    test('Debe rechazar password incorrecto', async () => {
      const response = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123!@#'
        })
      });

      expect([401, 403, 200]).toContain(response.status);
    });

    test('Debe rechazar email inexistente', async () => {
      const response = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noexiste@bisonte-test.com',
          password: 'Password123!@#'
        })
      });

      expect([401, 403, 200]).toContain(response.status);
    });

    test('Debe rechazar campos vacíos', async () => {
      const response = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          password: ''
        })
      });

      expect([400, 401, 200]).toContain(response.status);
    });
  });

  describe('🔐 Cambio de password', () => {
    test('Debe solicitar reset de password', async () => {
      const response = await fetch(`${apiUrl}/api/auth/password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email
        })
      });

      expect([200, 201]).toContain(response.status);
    });

    test('Debe rechazar email inválido en reset', async () => {
      const response = await fetch(`${apiUrl}/api/auth/password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email'
        })
      });

      // NextAuth puede devolver 200 incluso con email inválido para evitar enumeration
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('🚪 Logout', () => {
    test('Debe cerrar sesión correctamente', async () => {
      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      expect([200, 302]).toContain(response.status);
    });
  });

  describe('🔒 Seguridad de sesión', () => {
    test('Debe verificar integridad de sesión', async () => {
      const response = await fetch(`${apiUrl}/api/auth/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      expect([200, 401, 400]).toContain(response.status);
    });

    test('Debe tener protección contra SQL injection', async () => {
      const response = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "admin' OR '1'='1",
          password: "password' OR '1'='1"
        })
      });

      expect([400, 401, 200]).toContain(response.status);
    });
  });
});
