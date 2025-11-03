# 🧪 GUÍA COMPLETA DE TESTING - BISONTE LOGÍSTICA

## 📋 Índice
1. [Tests Creados](#tests-creados)
2. [Cómo Ejecutar Tests](#cómo-ejecutar-tests)
3. [Descripción de Tests](#descripción-de-tests)
4. [Resultados Esperados](#resultados-esperados)
5. [Solución de Problemas](#solución-de-problemas)

---

## ✅ TESTS CREADOS

Se han creado **4 suites de tests** que cubren:

### 1. **Tests de API - Registro** (`tests/api/register.test.js`)
- ✅ Registro exitoso de usuario
- ❌ Validación de campos inválidos
- 🔒 Sanitización de inputs (XSS prevention)
- 🔒 Rate limiting
- 📝 Validación de formatos

**Total**: ~15 tests

### 2. **Tests de API - Autenticación** (`tests/api/auth.test.js`)
- ✅ Login exitoso
- ❌ Login fallido (credenciales incorrectas)
- 🔐 Cambio de password
- 🚪 Logout
- 🔒 Protección contra SQL injection

**Total**: ~10 tests

### 3. **Tests de API - MercadoPago** (`tests/api/mercadopago.test.js`)
- ✅ Validación de datos de pago
- 💳 Procesamiento con diferentes métodos
- 🏦 Pagos PSE
- 🔍 Verificación de pagos
- 🔒 Sanitización y seguridad

**Total**: ~12 tests

### 4. **Tests E2E - Flujo Completo** (`tests/e2e/complete-flow.test.js`)
- 📝 Registro → 🔐 Login → 💰 Cotización → 📦 Envío → 💳 Pago → 📧 Confirmación → 🚪 Logout
- Simula el recorrido completo de un usuario

**Total**: ~15 tests

### 5. **Tests de Servicios de Seguridad** (`tests/unit/security-services.test.js`)
- ⏱️ TemporaryStorage (TTL, expiración)
- 🧹 Sanitización (nombres, emails, teléfonos, texto)
- 🔐 Password Validator (fuerza, patrones, entropía)
- 🎯 Integración de servicios

**Total**: ~35 tests

---

## 🚀 CÓMO EJECUTAR TESTS

### Requisitos Previos

1. **Servidor debe estar corriendo**:
   ```bash
   npm run dev
   ```
   O en otra terminal:
   ```bash
   npm run build && npm start
   ```

2. **Base de datos debe estar accesible**:
   - Verifica que PostgreSQL esté corriendo
   - Verifica variables de entorno en `.env`

### Comandos Disponibles

#### 🎯 Ejecutar TODOS los tests
```bash
npm run test:all
```
Este comando ejecuta todos los tests en orden y genera un reporte completo.

#### 📝 Tests de APIs individuales
```bash
# Test de Registro
npm run test:api:register

# Test de Autenticación
npm run test:api:auth

# Test de MercadoPago
npm run test:api:mercadopago

# Todos los tests de API
npm run test:api
```

#### 🔒 Tests de Seguridad
```bash
npm run test:security
```

#### 🎭 Test de Flujo Completo E2E
```bash
npm run test:flow
```

#### 📊 Con Coverage
```bash
npm run test:coverage
```

#### 👀 Modo Watch (desarrollo)
```bash
npm run test:watch
```

---

## 📖 DESCRIPCIÓN DE TESTS

### 📝 Tests de Registro (`register.test.js`)

#### Casos Exitosos ✅
- Registro de nuevo usuario con datos válidos
- Sanitización automática de inputs con XSS

#### Casos de Error ❌
- Campo nombre vacío
- Email inválido
- Password débil
- Email duplicado
- Celular inválido

#### Seguridad 🔒
- Rate limiting (10 requests rápidas)
- No exponer información sensible
- Prevención de SQL injection

#### Validación de Datos 📝
- Formato de nombre (solo letras, tildes, ñ)
- Formato de email
- Longitud de campos

### 🔐 Tests de Autenticación (`auth.test.js`)

#### Login ✅
- Autenticación con credenciales correctas
- Devolución de información del usuario

#### Login Fallido ❌
- Password incorrecto
- Email inexistente
- Campos vacíos

#### Cambio de Password 🔐
- Solicitud de reset
- Validación de email

#### Seguridad 🔒
- Protección contra SQL injection
- Verificación de integridad de sesión

### 💳 Tests de MercadoPago (`mercadopago.test.js`)

#### Procesamiento ✅
- Validación de estructura de datos
- Diferentes métodos de pago

#### Validaciones ❌
- Monto inválido (negativo, cero)
- Método de pago vacío

#### PSE 🏦
- Validación de datos completos
- Banco requerido

#### Seguridad 🔒
- No exponer tokens
- Sanitización de inputs
- Validación de montos

### 🎯 Test E2E - Flujo Completo (`complete-flow.test.js`)

#### Paso 1: Registro 📝
- Crear usuario de prueba
- Verificar que existe en BD

#### Paso 2: Login 🔐
- Autenticar usuario
- Obtener sesión

#### Paso 3: Cotización 💰
- Calcular tarifa de envío
- Validar dimensiones

#### Paso 4: Crear Envío 📦
- Guardar envío en BD
- Obtener ID

#### Paso 5: Pago 💳
- Procesar pago (simulado)
- Validar estructura

#### Paso 6: Confirmación 📧
- Consultar estado
- Listar envíos

#### Paso 7: Logout 🚪
- Cerrar sesión
- Invalidar token

### 🔒 Tests de Servicios de Seguridad (`security-services.test.js`)

#### TemporaryStorage ⏱️
- Guardar y recuperar datos
- Expiración automática (TTL)
- Limpieza de datos
- Manejo de datos inválidos

#### Sanitización 🧹
- Nombres (letras, tildes)
- Emails (lowercase, trim)
- Teléfonos (solo números)
- Texto general (XSS prevention)

#### Password Validator 🔐
- Passwords fuertes vs débiles
- Longitud mínima (8 caracteres)
- Mayúsculas requeridas
- Números requeridos
- Caracteres especiales requeridos
- Cálculo de fuerza (0-4)
- Detección de passwords comunes
- Cálculo de entropía

#### Integración 🎯
- Flujo completo de registro con sanitización
- Prevención de múltiples vectores de ataque

---

## 📊 RESULTADOS ESPERADOS

### Éxito Total ✅
```
📊 RESUMEN DE TESTS
==================================================
Total de tests ejecutados: 87
✅ Tests pasados: 87
❌ Tests fallidos: 0
⏭️ Suites omitidos: 0
⏱️ Duración total: ~45s
```

### Con Algunos Fallos ⚠️
Algunos tests pueden fallar si:
- Base de datos no está disponible
- Servidor no está corriendo
- Tokens de MercadoPago no configurados
- Rate limiting muy estricto

**Tests críticos** (deben pasar):
- 🔥 Registro de usuario
- 🔥 Autenticación básica
- 🔥 Servicios de seguridad
- 🔥 Sanitización
- 🔥 Password Validator

**Tests opcionales** (pueden fallar):
- MercadoPago (depende de tokens)
- PSE (requiere configuración)
- Rate limiting (depende de configuración)

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module '@/lib/...'"

**Solución**:
```bash
# Verificar que jest.config.js tenga el alias correcto
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

### Error: "ECONNREFUSED"

**Causa**: Servidor no está corriendo

**Solución**:
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar tests
npm run test:all
```

### Error: "Database connection failed"

**Causa**: PostgreSQL no está corriendo o .env no configurado

**Solución**:
```bash
# Verificar PostgreSQL
# Windows (PowerShell como Admin):
Get-Service postgresql*

# Verificar .env
cat .env | grep DATABASE_URL
```

### Tests de MercadoPago fallan

**Causa**: Tokens de prueba no configurados

**Solución**:
- Estos tests pueden fallar y es normal si no tienes tokens configurados
- Los tests validan la estructura, no la funcionalidad completa
- Para producción, usa tokens reales en `.env`

### Error: "Timeout exceeded"

**Causa**: Tests E2E toman más tiempo

**Solución**:
```bash
# Ejecutar con timeout mayor
npm run test:flow
# Ya tiene --testTimeout=30000 configurado
```

### Tests pasan localmente pero fallan en CI/CD

**Causas posibles**:
1. Variables de entorno no configuradas en CI
2. Base de datos no disponible
3. Servidor no inicia correctamente

**Solución**:
- Configurar secrets en GitHub Actions / Vercel
- Usar base de datos de prueba
- Agregar health checks antes de tests

---

## 📈 REPORTE DE TESTS

Después de ejecutar `npm run test:all`, se genera un reporte:

**Ubicación**: `tests/test-report.json`

**Contenido**:
```json
{
  "timestamp": "2025-11-03T...",
  "summary": {
    "totalTests": 87,
    "passed": 85,
    "failed": 2,
    "skipped": 0,
    "duration": "45.23"
  },
  "suites": [
    {
      "name": "Tests de API - Registro",
      "success": true,
      "critical": true,
      "duration": "8.5"
    },
    ...
  ]
}
```

---

## 🎯 MEJORES PRÁCTICAS

### Antes de Commit
```bash
# Ejecutar tests críticos
npm run test:api:register
npm run test:security
```

### Antes de Deploy
```bash
# Ejecutar todos los tests
npm run test:all

# Verificar coverage
npm run test:coverage
```

### Durante Desarrollo
```bash
# Modo watch para tests activos
npm run test:watch
```

---

## 📝 AGREGAR NUEVOS TESTS

### Estructura de Carpetas
```
tests/
├── api/              # Tests de endpoints
├── e2e/              # Tests de flujo completo
├── unit/             # Tests de servicios/utils
├── integration/      # Tests de integración
└── run-all-tests.js  # Script maestro
```

### Template de Test
```javascript
describe('Nombre del Test', () => {
  test('Debe hacer algo', async () => {
    // Arrange (preparar)
    const input = 'data';
    
    // Act (ejecutar)
    const result = await someFunction(input);
    
    // Assert (verificar)
    expect(result).toBe(expected);
  });
});
```

---

## 🔗 RECURSOS

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [API Testing Guide](https://www.freecodecamp.org/news/how-to-test-your-api/)

---

## ✅ CHECKLIST PRE-DEPLOY

- [ ] Todos los tests críticos pasan
- [ ] Coverage > 50%
- [ ] No hay vulnerabilidades de seguridad
- [ ] Tests E2E completan exitosamente
- [ ] Reporte de tests generado
- [ ] Variables de entorno configuradas en producción

---

## 📞 SOPORTE

Si encuentras problemas con los tests:
1. Revisa la sección "Solución de Problemas"
2. Verifica el reporte generado en `test-report.json`
3. Revisa los logs en consola
4. Asegúrate de que el servidor esté corriendo

**Tests creados el**: 3 de Noviembre de 2025  
**Última actualización**: 3 de Noviembre de 2025
