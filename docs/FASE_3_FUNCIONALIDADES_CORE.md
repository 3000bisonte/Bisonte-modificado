# Fase 3: Funcionalidades principales - Refactorización y validación

> Iniciada el 6 de octubre de 2025  
> Estado: **En progreso** (30% completado)

## Objetivos

1. ✅ **Modularizar Home.js** → dividir componente masivo (679 líneas) en módulos mantenibles
2. ✅ **Crear contratos Zod** para endpoints críticos (envío, tarifa, pago)
3. ⏳ **Revisar transacciones Prisma** en flujos de escritura
4. ⏳ **Estructurar tests de integración** para flujos core
5. ⏳ **Documentar arquitectura modular** resultante

---

## 1. Análisis inicial de Home.js

**Archivo:** `src/components/Home.js`  
**Líneas:** 679  
**Responsabilidades identificadas:**

- **Autenticación y sesión** (useSession, handleLogout)
- **Navegación y routing** (useRouter, redirects)
- **Slider de imágenes** (auto-play, touch/mouse handlers)
- **Modal de bienvenida** (primer inicio)
- **Menú de perfil** (dropdown, gestión de estado)
- **Sticky storage** (mantener usuario anclado 30 días)
- **Estadísticas** (usuarios, envíos, mensajes)
- **Renderizado de UI** (iconos SVG inline, layout complejo)

---

## 2. Componentes extraídos

### 2.1 Icons.tsx ✅

**Ubicación:** `src/components/home/Icons.tsx`  
**Propósito:** Consolidar todos los iconos SVG inline en un módulo reutilizable  
**Exporta:**
- `IconUser`, `IconHelp`, `IconLogout`, `IconChevronDown`
- `IconSparkles`, `IconChecklist`, `IconShield`, `IconLightning`, `IconPerfil`

**Beneficios:**
- Reutilización en múltiples componentes
- Fácil actualización de estilos
- Lazy loading potencial

### 2.2 HeroSlider.tsx ✅

**Ubicación:** `src/components/home/HeroSlider.tsx`  
**Propósito:** Slider de imágenes con auto-play y gestos táctiles  
**Props:**
```typescript
interface HeroSliderProps {
  slides?: SlideData[];
  autoPlayInterval?: number;
}
```

**Funcionalidades:**
- Auto-play configurable (default: 5s)
- Touch/swipe en móviles
- Mouse drag en desktop
- Indicadores interactivos
- Botones de navegación

**Beneficios:**
- TypeScript tipado
- Reutilizable en otras páginas
- Código testeable aislado

### 2.3 WelcomeModal.tsx ✅

**Ubicación:** `src/components/home/WelcomeModal.tsx`  
**Propósito:** Modal de bienvenida para nuevos usuarios  
**Props:**
```typescript
interface WelcomeModalProps {
  userName?: string;
  onClose: () => void;
}
```

**Funcionalidades:**
- Animación fade-in
- Redirección a perfil
- "Más tarde" skip
- Cierre por backdrop click

**Beneficios:**
- UI/UX centralizada
- Fácil de testear con Playwright
- Control de flujo onboarding

---

## 3. Schemas Zod para endpoints críticos

### 3.1 Schema de Envíos ✅

**Ubicación:** `src/schemas/envios.ts`

**Schemas creados:**
```typescript
// Estados válidos
export const EstadoEnvio = z.enum([
  "Pendiente", "En tránsito", "En reparto", 
  "Entregado", "Cancelado", "Devuelto"
]);

// Crear envío
export const crearEnvioSchema = z.object({
  Origen: z.string().trim().min(3).max(200),
  Destino: z.string().trim().min(3).max(200),
  Destinatario: z.string().trim().min(2).max(200),
  Remitente: z.string().trim().min(2).max(200),
  Estado: EstadoEnvio.optional().default("Pendiente"),
  NumeroGuia: z.string().regex(/^BST-\d+$/).optional(),
  PaymentId: z.string().max(100).optional(),
  usuarioId: z.number().int().positive().optional(),
});

// Actualizar estado
export const actualizarEstadoEnvioSchema = z.object({
  Estado: EstadoEnvio,
});

// Calcular tarifa
export const calcularTarifaSchema = z.object({
  origen: z.string().trim().min(2),
  destino: z.string().trim().min(2),
  peso: z.number().positive().max(1000).optional(),
  valorDeclarado: z.number().nonnegative().max(50_000_000).optional(),
});
```

**Pendiente de aplicar:**
- [ ] Integrar en `/api/orders/route.js` (POST)
- [ ] Integrar en `/api/envios/actualizar-estado/[id]/route.js`
- [ ] Crear endpoint `/api/tarifas/calcular` (nuevo)

### 3.2 Schema de Pagos (ya existente) ✅

**Ubicación:** `src/schemas/mercadopago.ts`

Ya tiene validación Zod completa para:
- `mercadoPagoCreateSchema`
- `mpPayerSchema`
- Transformaciones de `transaction_amount` e `installments`

---

## 4. Próximos pasos críticos

### 4.1 Refactorizar Home.js (pendiente)

**Objetivo:** Reducir de 679 líneas a <200 líneas

**Plan:**
1. Extraer lógica de autenticación → `useAuth` custom hook
2. Extraer lógica de perfil → `ProfileMenu.tsx` componente
3. Extraer lógica de sticky storage → `useHomeSticky` custom hook
4. Extraer sección de estadísticas → `StatsPanel.tsx` componente
5. Extraer sección de características → `FeaturesSection.tsx` componente
6. Consolidar Home.js como orquestador ligero

**Estructura propuesta:**
```
src/components/home/
├── Icons.tsx               ✅
├── HeroSlider.tsx          ✅
├── WelcomeModal.tsx        ✅
├── ProfileMenu.tsx         ⏳
├── StatsPanel.tsx          ⏳
├── FeaturesSection.tsx     ⏳
└── hooks/
    ├── useAuth.ts          ⏳
    └── useHomeSticky.ts    ⏳
```

### 4.2 Aplicar schemas Zod en endpoints

**Prioridad ALTA:**

**Endpoint 1: `/api/orders/route.js` (POST)**
```typescript
import { crearEnvioSchema } from "@/schemas/envios";

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validar con Zod
  const validated = crearEnvioSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validated.error.flatten() },
      { status: 400 }
    );
  }

  // Usar transacción Prisma
  const created = await prisma.$transaction(async (tx) => {
    return await tx.historial_envio.create({ data: validated.data });
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
```

**Endpoint 2: `/api/envios/actualizar-estado/[id]/route.js`**
```typescript
import { actualizarEstadoEnvioSchema } from "@/schemas/envios";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  
  const validated = actualizarEstadoEnvioSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Estado inválido", details: validated.error.flatten() },
      { status: 400 }
    );
  }

  // Validar estado actual antes de actualizar
  const updated = await prisma.$transaction(async (tx) => {
    const envio = await tx.historial_envio.findUnique({ where: { id: Number(params.id) } });
    if (!envio) throw new Error("Envío no encontrado");
    
    // Lógica de transición de estados permitida
    if (envio.Estado === "Entregado" || envio.Estado === "Cancelado") {
      throw new Error("No se puede actualizar un envío finalizado");
    }

    return await tx.historial_envio.update({
      where: { id: Number(params.id) },
      data: { Estado: validated.data.Estado },
    });
  });

  return NextResponse.json({ success: true, data: updated });
}
```

**Endpoint 3: Crear `/api/tarifas/calcular` (nuevo)**
```typescript
import { calcularTarifaSchema } from "@/schemas/envios";

export async function POST(request: Request) {
  const body = await request.json();
  
  const validated = calcularTarifaSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validated.error.flatten() },
      { status: 400 }
    );
  }

  // Lógica de cálculo de tarifa
  const { origen, destino, peso = 1, valorDeclarado = 0 } = validated.data;
  
  // Ejemplo simplificado (ajustar con lógica real)
  const tarifaBase = 15000; // COP
  const tarifaPeso = peso * 2000;
  const seguro = valorDeclarado * 0.01; // 1% del valor declarado
  
  const tarifaTotal = tarifaBase + tarifaPeso + seguro;
  
  return NextResponse.json({
    tarifa: tarifaTotal,
    moneda: "COP",
    tiempoEstimado: "1-3 días hábiles",
  });
}
```

### 4.3 Agregar transacciones Prisma

**Casos críticos donde usar `prisma.$transaction`:**

1. **Crear envío + registro de pago:**
   ```typescript
   await prisma.$transaction(async (tx) => {
     const envio = await tx.historial_envio.create({ data: envioData });
     await tx.pagos.create({ data: { envioId: envio.id, ...pagoData } });
     return envio;
   });
   ```

2. **Actualizar estado + notificación:**
   ```typescript
   await prisma.$transaction(async (tx) => {
     const updated = await tx.historial_envio.update({ where: { id }, data: { Estado } });
     await tx.notificaciones.create({ data: { usuarioId, mensaje: `Envío actualizado a ${Estado}` } });
     return updated;
   });
   ```

3. **Cancelar envío + reembolso (si aplica):**
   ```typescript
   await prisma.$transaction(async (tx) => {
     const envio = await tx.historial_envio.findUnique({ where: { id } });
     if (envio.Estado === "Entregado") throw new Error("No se puede cancelar");
     
     await tx.historial_envio.update({ where: { id }, data: { Estado: "Cancelado" } });
     if (envio.PaymentId) {
       // Iniciar proceso de reembolso
       await tx.reembolsos.create({ data: { paymentId: envio.PaymentId } });
     }
   });
   ```

### 4.4 Estructura de tests de integración

**Ubicación:** `tests/integration/`

**Test 1: Flujo completo de creación de envío**
```typescript
// tests/integration/envios.test.ts
describe("POST /api/orders", () => {
  it("debe crear un envío válido con todos los campos", async () => {
    const payload = {
      Origen: "Bogotá",
      Destino: "Medellín",
      Destinatario: "Juan Pérez",
      Remitente: "María López",
      Estado: "Pendiente",
      usuarioId: 1,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.NumeroGuia).toMatch(/^BST-\d+$/);
  });

  it("debe rechazar envío sin origen", async () => {
    const payload = { Destino: "Medellín", Destinatario: "Juan", Remitente: "María" };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(400);
  });
});
```

**Test 2: Cálculo de tarifa**
```typescript
// tests/integration/tarifas.test.ts
describe("POST /api/tarifas/calcular", () => {
  it("debe calcular tarifa correctamente", async () => {
    const payload = {
      origen: "Bogotá",
      destino: "Cali",
      peso: 5,
      valorDeclarado: 100000,
    };

    const response = await fetch("/api/tarifas/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.tarifa).toBeGreaterThan(0);
    expect(data.moneda).toBe("COP");
  });
});
```

**Test 3: Flujo de pago**
```typescript
// tests/integration/pagos.test.ts
describe("POST /api/mercadopago", () => {
  it("debe procesar pago y crear envío", async () => {
    const payload = {
      transaction_amount: 50000,
      description: "Envío Bogotá-Medellín",
      payer: {
        email: "test@example.com",
        identification: { type: "CC", number: "123456789" },
      },
    };

    const response = await fetch("/api/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    // Verificar que el envío se creó con PaymentId
  });
});
```

---

## 5. Métricas de progreso

| Tarea | Estado | Completado |
| --- | --- | --- |
| Análisis de Home.js | ✅ | 100% |
| Extracción de Icons | ✅ | 100% |
| Extracción de HeroSlider | ✅ | 100% |
| Extracción de WelcomeModal | ✅ | 100% |
| Creación de schemas Zod | ✅ | 100% |
| Extracción de ProfileMenu | ⏳ | 0% |
| Extracción de StatsPanel | ⏳ | 0% |
| Custom hooks (useAuth, useHomeSticky) | ⏳ | 0% |
| Aplicar Zod en `/api/orders` | ⏳ | 0% |
| Aplicar Zod en actualizar estado | ⏳ | 0% |
| Crear endpoint `/api/tarifas/calcular` | ⏳ | 0% |
| Agregar transacciones Prisma | ⏳ | 0% |
| Tests de integración (crear envío) | ⏳ | 0% |
| Tests de integración (tarifa) | ⏳ | 0% |
| Tests de integración (pago) | ⏳ | 0% |
| Documentación arquitectura modular | ⏳ | 0% |

**Progreso global: 30%**

---

## 6. Decisiones pendientes

1. **¿Migrar Home.js a TypeScript ahora o después?**
   - Pro: Consistencia total
   - Contra: Retrasa refactor funcional

2. **¿Usar React Query para fetching de stats?**
   - Pro: Cache automático, revalidación
   - Contra: Nueva dependencia

3. **¿Implementar lógica de cálculo de tarifa real o mock?**
   - Depende de disponibilidad de API de transporte externa

4. **¿Cuándo aplicar las migraciones de transacciones?**
   - Requiere pruebas exhaustivas antes de prod

---

## 7. Próxima sesión sugerida

**Prioridades:**
1. Aplicar schemas Zod en `/api/orders` (1 hora)
2. Extraer ProfileMenu y StatsPanel (1 hora)
3. Crear endpoint `/api/tarifas/calcular` con mock (30 min)
4. Primer test de integración básico (30 min)

**Total estimado: 3 horas**

---

**Estado actual:** Fundamentos de Fase 3 establecidos. Componentes modulares creados. Contratos Zod definidos. Listo para aplicar validaciones y tests.
