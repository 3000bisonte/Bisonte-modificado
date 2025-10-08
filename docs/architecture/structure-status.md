# Estado de la estructura del monorepo

> Actualizado el 6 de octubre de 2025.
>
> Este documento resume qué módulos permanecen activos en el flujo de trabajo diario y cuáles se consideran legados o en proceso de revisión.

## Resumen rápido

| Módulo / Paquete | Ruta | Estado | Notas |
| --- | --- | --- | --- |
| Aplicación web Next.js | `src/` | ✅ Activo | Código principal (App Router, componentes, librerías). Debe mantenerse tipado y cubierto por lint/tests. |
| Configuración compartida | `config/` | ✅ Activo | Bases de ESLint, Tailwind, entornos. Requiere sincronización cuando cambian las reglas globales. |
| Recursos compartidos | `shared/`, `resources/`, `icons/`, `public/` | ✅ Activo | Activos y utilidades consumidas por la aplicación web. |
| Scripts operativos | `scripts/` | ⚠️ Parcial | Mezcla de scripts vigentes y otros históricos. Marcar obsoletos durante las siguientes iteraciones. |
| Proyecto móvil Capacitor | `mobile/` | ✅ Activo | Proyecto Android/iOS que consume el bundle web mediante Capacitor. |
| Wrapper Android nativo | `android/` | ✅ Activo | Artefactos generados por Capacitor; se regeneran con `npx cap sync`. |
| Plugin nativo de autenticación | `native/capacitor-bisonte-auth/` | ✅ Activo | Librería propia para manejar Google Sign-In nativo. Mantener versión alineada con Capacitor. |
| Base de datos y ORM | `prisma/` | ✅ Activo | Esquema Prisma y cliente generado. |
| Pruebas | `tests/` | ⚠️ En revisión | Estructura de unit/integration/E2E existente, pero suites no pasan actualmente. |
| Documentación | `docs/` | ✅ Activo | Contiene manuales técnicos vigentes. Añadir guía de estado de módulos en este documento. |
| Infraestructura heredada | `infra/` | ⚠️ En revisión | Contiene configuraciones antiguas. Validar antes de usar en despliegues modernos. |
| Paquetes y funciones Netlify (legacy) | `archive/legacy-monorepo/netlify/`<br>`archive/legacy-monorepo/netlify-bisonte-api/` | 📦 Archivado | Movidos fuera del workspace activo. Mantener sólo como referencia histórica. |
| Código heredado adicional | `archive/` | 📦 Archivado | Contiene implementaciones previas (backend legacy, pruebas antiguas, etc.). |

## Pendientes detectados

- Clasificar los scripts de `scripts/` entre vigentes y obsoletos, trasladando los legacy a `archive/`.
- Revisar `infra/` para decidir si se migra a documentación o se reincorpora a un flujo automatizado.
- Completar esta tabla a medida que se limpien submódulos adicionales (p. ej. servicios backend específicos, utilidades móviles).

## Convenciones

- **Activo**: se utiliza en build, desarrollo o despliegue actuales.
- **En revisión**: requiere validación; puede contener mezclas de código nuevo y legacy.
- **Archivado**: no se usa en el flujo actual; mover nuevas piezas legacy a `archive/legacy-monorepo/`.
