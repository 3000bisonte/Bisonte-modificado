# 🎯 Sistema de Monitoreo de Loading Global

## 📋 Descripción

Sistema automático que monitorea estados `isLoading` de botones y componentes. Si un estado de loading permanece activo durante más de **3 segundos**, se activa automáticamente una pantalla de loading global que:

- ✅ Cubre toda la interfaz
- ✅ Bloquea la interacción del usuario
- ✅ Muestra un mensaje personalizado
- ✅ Se desactiva automáticamente cuando el loading termina

## 🏗️ Arquitectura

### 1. GlobalLoadingContext (`src/contexts/GlobalLoadingContext.js`)

Contexto global que gestiona el estado de la pantalla de loading:

```javascript
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

const {
  isGlobalLoading,          // Estado actual de la pantalla
  loadingMessage,           // Mensaje mostrado
  registerLoading,          // Registrar un nuevo loading
  unregisterLoading,        // Desregistrar un loading
  updateLoadingMessage,     // Actualizar mensaje
  setGlobalLoadingState     // Forzar activación/desactivación
} = useGlobalLoading();
```

### 2. GlobalLoadingScreen (`src/components/GlobalLoadingScreen.js`)

Componente visual que muestra la pantalla de loading. Se renderiza automáticamente en el layout principal.

### 3. useLoadingMonitor (`src/hooks/useLoadingMonitor.js`)

Hook que monitorea automáticamente un estado `isLoading`:

```javascript
import { useLoadingMonitor } from '@/hooks/useLoadingMonitor';

// Uso básico
useLoadingMonitor(isLoading, 'button-id', 'Procesando...');
```

### 4. useMultipleLoadingMonitor

Hook para monitorear múltiples estados simultáneamente:

```javascript
import { useMultipleLoadingMonitor } from '@/hooks/useLoadingMonitor';

useMultipleLoadingMonitor({
  'payment': isPaymentLoading,
  'validation': isValidating,
  'submission': isSubmitting
}, 'Procesando tu solicitud...');
```

## 🚀 Uso

### Implementación Básica

1. **En cualquier componente con estado `isLoading`:**

```javascript
import { useLoadingMonitor } from '@/hooks/useLoadingMonitor';

function MiComponente() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Monitorear automáticamente
  useLoadingMonitor(isLoading, 'mi-componente', 'Procesando...');
  
  const handleClick = async () => {
    setIsLoading(true);
    try {
      await miOperacionAsincrona();
    } finally {
      setIsLoading(false); // La pantalla se oculta automáticamente
    }
  };
  
  return <button onClick={handleClick}>Procesar</button>;
}
```

### Monitoreo Múltiple

```javascript
function FormularioComplejo() {
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  useMultipleLoadingMonitor({
    'save': isSaving,
    'validate': isValidating,
    'upload': isUploading
  }, 'Guardando formulario...');
  
  // ...resto del componente
}
```

### Control Manual

Si necesitas control total sobre la pantalla de loading:

```javascript
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

function ComponenteAvanzado() {
  const { setGlobalLoadingState } = useGlobalLoading();
  
  const procesoComplejo = async () => {
    // Activar manualmente
    setGlobalLoadingState(true, 'Procesando operación compleja...');
    
    try {
      await paso1();
      // Cambiar mensaje
      setGlobalLoadingState(true, 'Casi listo...');
      await paso2();
    } finally {
      // Desactivar
      setGlobalLoadingState(false);
    }
  };
  
  return <button onClick={procesoComplejo}>Ejecutar</button>;
}
```

## 📦 Componentes Implementados

Los siguientes componentes ya tienen el monitoreo automático activado:

### ✅ FormularioRemitente.js
- **Loading ID:** `formulario-remitente`
- **Mensaje:** "Guardando información del remitente..."
- **Estado monitoreado:** `isLoading`

### ✅ FormularioDestinatario.js
- **Loading ID:** `formulario-destinatario`
- **Mensaje:** "Guardando información del destinatario..."
- **Estado monitoreado:** `isLoading`

### ✅ Resumen.js
- **Monitoreo múltiple:**
  - `shipment-creation`: Creación de envío
  - `admob-loading`: Carga de anuncios AdMob
  - `ad-loading`: Estado de anuncios legacy
- **Mensaje:** "Procesando tu solicitud..."

### ✅ LoginForm.js
- **Loading ID:** `login-form`
- **Mensaje:** "Iniciando sesión..."
- **Estado monitoreado:** `isLoading`

### ✅ Cotizador.js
- **Loading ID:** `cotizador-action`
- **Mensaje:** "Procesando cotización..."
- **Estado monitoreado:** `isLoadingAction`

## ⚙️ Configuración

### Cambiar el tiempo de espera (3 segundos por defecto)

Edita `src/contexts/GlobalLoadingContext.js`:

```javascript
const timer = setTimeout(() => {
  setIsGlobalLoading(true);
}, 5000); // Cambiar a 5 segundos
```

### Personalizar el estilo

Edita `src/components/GlobalLoadingScreen.js` para cambiar colores, animaciones o diseño.

## 🎨 Características de la Pantalla

- **Fondo semitransparente oscuro** con blur
- **Modal centrado** con animación de entrada
- **Spinner doble** con animación suave
- **Mensaje personalizable**
- **Barra de progreso** animada
- **Bloqueo total de interacción** (pointer-events)
- **Cursor de espera** (wait cursor)

## 🧪 Testing

Para probar el sistema:

1. Agrega un delay artificial a una operación:
```javascript
const handleTest = async () => {
  setIsLoading(true);
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos
  setIsLoading(false);
};
```

2. La pantalla global debería aparecer después de 3 segundos
3. Desaparecerá automáticamente cuando se complete

## 📝 Buenas Prácticas

1. **Siempre usa un ID único** para cada componente/operación
2. **Proporciona mensajes descriptivos** que informen al usuario
3. **No olvides desactivar** el loading en el `finally` block
4. **Usa el monitoreo múltiple** cuando tengas varios estados relacionados
5. **No abuses del sistema** - úsalo solo para operaciones críticas

## 🐛 Troubleshooting

### La pantalla no aparece
- Verifica que el componente esté dentro de `GlobalLoadingProvider`
- Asegúrate de que el estado `isLoading` cambie correctamente
- Revisa la consola para logs de monitoreo

### La pantalla no desaparece
- Verifica que `setIsLoading(false)` se ejecute en todos los casos
- Usa `finally` block para garantizar la desactivación
- Revisa que no haya errores no capturados

### Múltiples pantallas activas
- Cada componente debe usar un `loadingId` único
- El sistema maneja automáticamente múltiples loadings activos

## 🔄 Flujo de Trabajo

```
1. Usuario hace clic en botón
2. setIsLoading(true)
3. useLoadingMonitor detecta el cambio
4. Inicia timer de 3 segundos
5. Si loading continúa → Activa pantalla global
6. Operación completa → setIsLoading(false)
7. useLoadingMonitor detecta cambio
8. Cancela timer / Desactiva pantalla
```

## 📚 Referencias

- **Contexto:** `src/contexts/GlobalLoadingContext.js`
- **Pantalla:** `src/components/GlobalLoadingScreen.js`
- **Hooks:** `src/hooks/useLoadingMonitor.js`
- **Provider:** `src/app/Providers.js`

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025  
**Autor:** Bisonte Logística Dev Team
