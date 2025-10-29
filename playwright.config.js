const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuración de Playwright para Tests E2E
 * Sistema de Prevención de Duplicación de Órdenes - Bisonte Logística
 */

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // Timeout por test: 60 segundos
  timeout: 60 * 1000,
  
  // Reintentos en caso de fallo
  retries: process.env.CI ? 2 : 0,
  
  // Ejecución en paralelo
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Configuración compartida para todos los tests
  use: {
    // URL base de la aplicación
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Captura de trazas solo en el primer reintento
    trace: 'on-first-retry',
    
    // Screenshots solo en fallos
    screenshot: 'only-on-failure',
    
    // Videos solo en fallos
    video: 'retain-on-failure',
    
    // Timeout para acciones individuales: 10 segundos
    actionTimeout: 10 * 1000,
    
    // Timeout para navegación: 30 segundos
    navigationTimeout: 30 * 1000,
    
    // Locale y timezone
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignorar errores HTTPS en desarrollo
    ignoreHTTPSErrors: true,
  },
  
  // Proyectos de navegadores
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Modo headless: false para ver el navegador durante los tests
        headless: false,
        // Slow motion: 500ms para ver mejor las interacciones
        slowMo: 500
      },
    },
    
    // Descomentar para probar en otros navegadores
    /*
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: false,
        slowMo: 500
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        headless: false,
        slowMo: 500
      },
    },
    */
  ],
  
  // Servidor de desarrollo (Next.js)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos para iniciar
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
