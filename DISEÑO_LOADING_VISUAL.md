# 🎨 Diseño Visual de la Pantalla de Loading Global

## Vista Previa

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [FONDO OSCURO CON BLUR]                 │
│                                                             │
│              ┌───────────────────────────┐                 │
│              │                           │                 │
│              │      ╭───────────╮        │                 │
│              │      │    ●●●    │        │ ← Spinner Doble │
│              │      │   ●   ●   │        │   Animado      │
│              │      │    ●●●    │        │                 │
│              │      ╰───────────╯        │                 │
│              │                           │                 │
│              │    Procesando...          │ ← Título       │
│              │                           │                 │
│              │ Estamos procesando tu     │ ← Mensaje      │
│              │      solicitud...         │   Personalizado│
│              │                           │                 │
│              │   ▓▓▓░░░░░░░░░░░░        │ ← Barra de     │
│              │                           │   Progreso     │
│              │                           │                 │
│              │  Por favor, no cierres    │ ← Nota         │
│              │    esta ventana           │                 │
│              │                           │                 │
│              └───────────────────────────┘                 │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Especificaciones de Diseño

### Colores
- **Fondo:** `rgba(0, 0, 0, 0.6)` con `backdrop-blur-sm`
- **Modal:** `#FFFFFF` (blanco)
- **Spinner Principal:** `#41e0b3` (verde agua Bisonte)
- **Spinner Secundario:** `#2bbd8c` (verde más oscuro)
- **Texto Título:** `#1F2937` (gris oscuro)
- **Texto Mensaje:** `#4B5563` (gris medio)
- **Texto Nota:** `#9CA3AF` (gris claro)
- **Barra Progreso:** Gradiente `#41e0b3` → `#2bbd8c`

### Dimensiones
- **Modal:** `max-w-md` (448px max)
- **Padding Modal:** `2rem` (32px)
- **Spinner:** `20 × 20` (80px)
- **Borde Spinner:** `4px`
- **Border Radius Modal:** `1rem` (16px)
- **Altura Barra:** `1.5` (6px)

### Animaciones

#### Spinner Principal
```css
animation: spin 1s linear infinite;

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### Spinner Secundario
```css
animation: spin-slow 1.5s linear infinite;

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
```

#### Entrada del Modal
```css
animation: fade-in 0.3s ease-out;

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

#### Barra de Progreso
```css
animation: progress 1.5s ease-in-out infinite;

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Sombras
- **Modal:** `shadow-2xl` (0 25px 50px -12px rgba(0, 0, 0, 0.25))

### Tipografía
- **Título "Procesando...":** `text-xl` (20px), `font-bold`
- **Mensaje:** `text-sm` (14px), `text-gray-600`
- **Nota:** `text-xs` (12px), `text-gray-400`

## 📱 Responsive

### Mobile (<640px)
```
┌─────────────────────┐
│                     │
│   [PANTALLA FULL]   │
│                     │
│  ┌───────────────┐  │
│  │   ●●●         │  │
│  │  ●   ●        │  │
│  │   ●●●         │  │
│  │               │  │
│  │ Procesando... │  │
│  │               │  │
│  │ Mensaje...    │  │
│  │               │  │
│  │ ▓▓▓░░░░░░░   │  │
│  │               │  │
│  │ Por favor...  │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```
- Padding reducido: `mx-4` (16px)
- Texto más pequeño si es necesario

### Tablet (640px - 1024px)
- Modal centrado con margen
- Tamaños de texto estándar

### Desktop (>1024px)
- Modal centrado con max-width
- Todos los elementos con tamaño completo

## 🎭 Estados Visuales

### Estado: Idle (No visible)
```
Display: none
Opacity: 0
```

### Estado: Activado (Visible)
```
Display: flex
Opacity: 1
Z-index: 9999
Pointer-events: all
Cursor: wait
```

### Estado: Transición de Entrada
```
Animation: fade-in 0.3s ease-out
Transform: scale(0.95) → scale(1)
Opacity: 0 → 1
```

## 🔍 Detalles de Implementación

### Spinner Doble
```jsx
<div className="relative w-20 h-20">
  {/* Anillo estático de fondo */}
  <div className="absolute inset-0 border-4 border-[#41e0b3]/20 rounded-full" />
  
  {/* Spinner principal (sentido horario) */}
  <div className="absolute inset-0 border-4 border-transparent border-t-[#41e0b3] rounded-full animate-spin" />
  
  {/* Spinner secundario (sentido antihorario) */}
  <div className="absolute inset-2 border-4 border-transparent border-t-[#2bbd8c] rounded-full animate-spin-slow" />
</div>
```

### Barra de Progreso Animada
```jsx
<div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
  <div className="h-full bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] animate-progress" />
</div>
```

### Texto con Espaciado
```jsx
<div className="text-center space-y-2">
  <h3 className="text-xl font-bold text-gray-800">
    Procesando...
  </h3>
  <p className="text-gray-600 text-sm">
    {loadingMessage}
  </p>
</div>
```

## 🎨 Variaciones de Color

### Tema Claro (Actual)
```css
background: white
text: gray-800
spinner: #41e0b3
```

### Tema Oscuro (Opcional)
```css
background: #1F2937
text: white
spinner: #41e0b3
```

### Tema de Advertencia
```css
background: #FEF3C7
text: #92400E
spinner: #F59E0B
```

### Tema de Error
```css
background: #FEE2E2
text: #991B1B
spinner: #EF4444
```

## 📐 Estructura HTML Simplificada

```html
<div class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm">
  <div class="flex items-center justify-center min-h-screen">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
      <div class="flex flex-col items-center space-y-6">
        
        <!-- Spinner -->
        <div class="relative w-20 h-20">...</div>
        
        <!-- Texto -->
        <div class="text-center space-y-2">
          <h3>Procesando...</h3>
          <p>{message}</p>
        </div>
        
        <!-- Barra de Progreso -->
        <div class="w-full">...</div>
        
        <!-- Nota -->
        <p class="text-xs">Por favor, no cierres esta ventana</p>
        
      </div>
    </div>
  </div>
</div>
```

## ✨ Mejoras Futuras Posibles

1. **Porcentaje de Progreso Real**
   ```jsx
   <p>{progress}%</p>
   <div style={{ width: `${progress}%` }} />
   ```

2. **Iconos Dinámicos**
   ```jsx
   {type === 'upload' && <UploadIcon />}
   {type === 'download' && <DownloadIcon />}
   ```

3. **Botón de Cancelación**
   ```jsx
   <button onClick={onCancel}>Cancelar</button>
   ```

4. **Múltiples Pasos**
   ```jsx
   <div>Paso {currentStep} de {totalSteps}</div>
   ```

5. **Timer Visible**
   ```jsx
   <p>Tiempo transcurrido: {elapsed}s</p>
   ```

---

**Nota:** El diseño actual es minimalista y profesional, enfocado en la experiencia del usuario sin ser intrusivo.
