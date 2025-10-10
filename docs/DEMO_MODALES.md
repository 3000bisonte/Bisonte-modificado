# 🎨 Demostración Visual del Sistema de Modales

## Vista Previa del Componente NotificationModal

### ✅ Modal de Éxito (Success)
```
┌─────────────────────────────────────────────┐
│                                             │
│           ╭─────────────────╮              │
│           │  ✓  (verde)     │              │
│           ╰─────────────────╯              │
│                                             │
│        ¡Envío Registrado! 🎉               │
│                                             │
│   Tu envío gratuito ha sido registrado     │
│   exitosamente. Serás redirigido a         │
│   Mis Envíos.                              │
│                                             │
│   ┌────────────────────────────────────┐   │
│   │        Entendido                   │   │
│   └────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Colores**:
- Fondo del ícono: `bg-green-100` (verde claro)
- Borde del ícono: `border-green-500` (verde intenso)
- Ícono: `text-green-600` (verde medio)
- Botón: Gradiente verde-turquesa

---

### ❌ Modal de Error
```
┌─────────────────────────────────────────────┐
│                                             │
│           ╭─────────────────╮              │
│           │  ✕  (rojo)      │              │
│           ╰─────────────────╯              │
│                                             │
│           Error de Conexión                │
│                                             │
│   Hubo un problema de conexión al          │
│   registrar tu envío. Por favor, verifica  │
│   tu internet e intenta nuevamente.        │
│                                             │
│   ╭────────────────────────────────────╮   │
│   │ Detalles del error (opcional)      │   │
│   │ NetworkError: fetch failed         │   │
│   │ Status: 500                        │   │
│   ╰────────────────────────────────────╯   │
│                                             │
│   ┌────────────────────────────────────┐   │
│   │        Entendido                   │   │
│   └────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Colores**:
- Fondo del ícono: `bg-red-100` (rojo claro)
- Borde del ícono: `border-red-500` (rojo intenso)
- Ícono: `text-red-600` (rojo medio)
- Detalles: Fondo gris claro con borde

---

### ⚠️ Modal de Advertencia (Warning)
```
┌─────────────────────────────────────────────┐
│                                             │
│           ╭─────────────────╮              │
│           │  ⚠  (ámbar)     │              │
│           ╰─────────────────╯              │
│                                             │
│          Datos Incompletos                 │
│                                             │
│   Faltan datos del envío. Por favor,      │
│   regresa y completa toda la información   │
│   requerida.                               │
│                                             │
│   ┌────────────────────────────────────┐   │
│   │        Entendido                   │   │
│   └────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Colores**:
- Fondo del ícono: `bg-amber-100` (ámbar claro)
- Borde del ícono: `border-amber-500` (ámbar intenso)
- Ícono: `text-amber-600` (ámbar medio)

---

### ℹ️ Modal de Información (Info)
```
┌─────────────────────────────────────────────┐
│                                             │
│           ╭─────────────────╮              │
│           │  ℹ  (azul)      │              │
│           ╰─────────────────╯              │
│                                             │
│       Anuncios no disponibles              │
│                                             │
│   Los anuncios solo están disponibles en   │
│   la app móvil. 📱                         │
│                                             │
│   💡 Descarga la app para obtener          │
│   descuentos increíbles.                   │
│                                             │
│   ┌────────────────────────────────────┐   │
│   │        Entendido                   │   │
│   └────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Colores**:
- Fondo del ícono: `bg-blue-100` (azul claro)
- Borde del ícono: `border-blue-500` (azul intenso)
- Ícono: `text-blue-600` (azul medio)

---

## 🎬 Animaciones

### Secuencia de Aparición

1. **Background Overlay** (0.3s)
   ```
   opacity: 0 → 1
   backdrop-filter: blur(0) → blur(4px)
   ```

2. **Modal Content** (0.3s, simultáneo)
   ```
   opacity: 0 → 1
   scale: 0.9 → 1
   ```

### Efecto Visual
```
Frame 1 (0ms):
  [Pantalla normal sin modal]

Frame 2 (100ms):
  [Fondo oscuro apareciendo - 33% opacidad]
  [Modal pequeño - 93% tamaño]

Frame 3 (200ms):
  [Fondo oscuro - 66% opacidad]
  [Modal creciendo - 96% tamaño]

Frame 4 (300ms):
  [Fondo oscuro completo - 100% opacidad con blur]
  [Modal tamaño completo - 100%]
  ✨ Animación completada
```

---

## 📱 Responsive Behavior

### Desktop (> 768px)
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│              ┌──────────────────────┐                 │
│              │                      │                 │
│              │    Modal 448px       │                 │
│              │    (max-width)       │                 │
│              │                      │                 │
│              └──────────────────────┘                 │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────────┐
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │    Modal width: 100%     │ │
│ │    con márgenes 1rem     │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

---

## 🎨 Paleta de Colores Completa

### Success (Verde)
- **Background Icon**: `#ecfdf5` (green-100)
- **Border Icon**: `#22c55e` (green-500)
- **Icon Color**: `#16a34a` (green-600)
- **Button Gradient**: `#41e0b3` → `#2bbd8c`

### Error (Rojo)
- **Background Icon**: `#fef2f2` (red-100)
- **Border Icon**: `#ef4444` (red-500)
- **Icon Color**: `#dc2626` (red-600)
- **Button Gradient**: `#41e0b3` → `#2bbd8c`

### Warning (Ámbar)
- **Background Icon**: `#fef3c7` (amber-100)
- **Border Icon**: `#f59e0b` (amber-500)
- **Icon Color**: `#d97706` (amber-600)
- **Button Gradient**: `#41e0b3` → `#2bbd8c`

### Info (Azul)
- **Background Icon**: `#dbeafe` (blue-100)
- **Border Icon**: `#3b82f6` (blue-500)
- **Icon Color**: `#2563eb` (blue-600)
- **Button Gradient**: `#41e0b3` → `#2bbd8c`

---

## 🔧 Estructura del Modal

```jsx
<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
  ↑ Overlay con blur
  
  <div className="bg-white rounded-3xl shadow-2xl border-2 p-8">
    ↑ Contenedor del modal
    
    <div className="w-20 h-20 rounded-full border-4">
      ↑ Contenedor del ícono (80x80px)
      
      <svg className="w-10 h-10">
        ↑ Ícono SVG (40x40px)
      </svg>
    </div>
    
    <h3 className="text-2xl font-bold">
      ↑ Título
    </h3>
    
    <p className="text-gray-700 text-base">
      ↑ Mensaje principal
    </p>
    
    <div className="bg-gray-50 rounded-xl p-4">
      ↑ Área de detalles (opcional)
      <p className="text-sm font-mono">
        ↑ Detalles técnicos
      </p>
    </div>
    
    <button className="w-full py-4 rounded-xl">
      ↑ Botón de acción
    </button>
  </div>
</div>
```

---

## 💡 Casos de Uso Implementados

| Situación | Tipo | Título | Acción |
|-----------|------|--------|--------|
| Envío ya gratis | Success | ¡Felicidades! | Cerrar |
| Anuncio preparándose | Info | Preparando anuncio | Cerrar |
| Sin app móvil | Info | Anuncios no disponibles | Cerrar |
| Sin sesión | Error | Error de Sesión | Cerrar |
| Datos faltantes | Warning | Datos Incompletos | Cerrar |
| Envío creado | Success | ¡Envío Registrado! | Auto-redirige + Cerrar |
| Error validación | Error | Error de Validación | Mostrar detalles + Cerrar |
| Error servidor | Error | Error al Registrar | Cerrar |
| Sin conexión | Error | Error de Conexión | Cerrar |

---

## 🎯 Accesibilidad

- **z-index**: `100` (por encima de todo)
- **backdrop**: Oscuro con blur para foco visual
- **contraste**: Cumple WCAG AA
- **tamaños**: Texto legible (16px base, 24px título)
- **tap targets**: Botón 48px altura mínimo
- **keyboard**: ESC para cerrar (pendiente implementar)

---

**Total de Modales**: 9 diferentes  
**Componente**: Reutilizable  
**Framework**: React + Tailwind CSS  
**Animaciones**: CSS keyframes nativas
