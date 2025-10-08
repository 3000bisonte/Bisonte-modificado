# 🎯 Ejemplos de Uso del Sistema de Loading Global

## 📚 Casos de Uso Comunes

### 1. Formulario Simple

```javascript
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';

function FormularioSimple() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '' });
  
  // Monitorear automáticamente
  useLoadingMonitor(isLoading, 'formulario-simple', 'Guardando datos...');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/guardar', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      alert('Guardado exitoso!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false); // Pantalla se oculta automáticamente
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={formData.nombre}
        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
```

### 2. Pago con Múltiples Pasos

```javascript
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

function ProcesoPago() {
  const { setGlobalLoadingState } = useGlobalLoading();
  
  const procesarPago = async () => {
    try {
      // Paso 1: Validar tarjeta
      setGlobalLoadingState(true, 'Validando datos de pago...');
      await validarTarjeta();
      
      // Paso 2: Procesar cargo
      setGlobalLoadingState(true, 'Procesando cargo...');
      await procesarCargo();
      
      // Paso 3: Generar factura
      setGlobalLoadingState(true, 'Generando factura...');
      await generarFactura();
      
      alert('Pago exitoso!');
    } catch (error) {
      alert('Error en el pago: ' + error.message);
    } finally {
      setGlobalLoadingState(false);
    }
  };
  
  return <button onClick={procesarPago}>Pagar</button>;
}
```

### 3. Carga de Archivos con Progreso

```javascript
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';

function SubidaArchivos() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useLoadingMonitor(isUploading, 'upload-files', 'Subiendo archivos...');
  
  const handleUpload = async (files) => {
    setIsUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });
      
      if (!response.ok) throw new Error('Upload failed');
      alert('Archivos subidos!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <input type="file" multiple onChange={(e) => handleUpload(e.target.files)} />
      {isUploading && <p>Progreso: {progress}%</p>}
    </div>
  );
}
```

### 4. Operaciones Concurrentes

```javascript
import { useMultipleLoadingMonitor } from '../hooks/useLoadingMonitor';

function DashboardComplejo() {
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  useMultipleLoadingMonitor({
    'user-data': isLoadingUser,
    'orders-data': isLoadingOrders,
    'stats-data': isLoadingStats
  }, 'Cargando información del dashboard...');
  
  useEffect(() => {
    const loadDashboard = async () => {
      // Cargar datos en paralelo
      setIsLoadingUser(true);
      setIsLoadingOrders(true);
      setIsLoadingStats(true);
      
      try {
        await Promise.all([
          fetchUserData().finally(() => setIsLoadingUser(false)),
          fetchOrders().finally(() => setIsLoadingOrders(false)),
          fetchStats().finally(() => setIsLoadingStats(false))
        ]);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };
    
    loadDashboard();
  }, []);
  
  return <div>Dashboard Content</div>;
}
```

### 5. Integración con React Query

```javascript
import { useQuery } from '@tanstack/react-query';
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  // Monitorear el estado de React Query
  useLoadingMonitor(isLoading, 'products-query', 'Cargando productos...');
  
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 6. Reintento Automático con Delay

```javascript
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';

function ConexionRobusta() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  useLoadingMonitor(
    isRetrying, 
    'connection-retry', 
    `Reintentando conexión... (${retryCount}/${maxRetries})`
  );
  
  const connectWithRetry = async () => {
    setIsRetrying(true);
    setRetryCount(0);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        setRetryCount(i + 1);
        const result = await attemptConnection();
        
        if (result.success) {
          alert('Conectado!');
          setIsRetrying(false);
          return;
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          alert('No se pudo conectar después de ' + maxRetries + ' intentos');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        }
      }
    }
    
    setIsRetrying(false);
  };
  
  return <button onClick={connectWithRetry}>Conectar</button>;
}
```

### 7. Operación con Timeout

```javascript
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';

function OperacionConTimeout() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  useLoadingMonitor(isProcessing, 'timed-operation', 'Procesando con timeout...');
  
  const executeWithTimeout = async () => {
    setIsProcessing(true);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 30000) // 30 segundos
    );
    
    const operationPromise = realizarOperacionLarga();
    
    try {
      const result = await Promise.race([operationPromise, timeoutPromise]);
      alert('Operación exitosa!');
      return result;
    } catch (error) {
      if (error.message === 'Timeout') {
        alert('La operación tardó demasiado tiempo');
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  return <button onClick={executeWithTimeout}>Ejecutar con Timeout</button>;
}
```

### 8. Integración con Redux/Zustand

```javascript
// Con Zustand
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';
import { useStore } from '../store/useStore';

function ComponenteConStore() {
  const { isSubmitting, submitForm } = useStore();
  
  useLoadingMonitor(isSubmitting, 'store-submit', 'Enviando formulario...');
  
  return (
    <button onClick={submitForm} disabled={isSubmitting}>
      {isSubmitting ? 'Enviando...' : 'Enviar'}
    </button>
  );
}

// Store definition
const useStore = create((set) => ({
  isSubmitting: false,
  submitForm: async (data) => {
    set({ isSubmitting: true });
    try {
      await api.submit(data);
    } finally {
      set({ isSubmitting: false });
    }
  }
}));
```

### 9. Manejo de Errores Avanzado

```javascript
import { useLoadingMonitor } from '../hooks/useLoadingMonitor';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

function FormularioConErrores() {
  const [isLoading, setIsLoading] = useState(false);
  const { updateLoadingMessage } = useGlobalLoading();
  
  useLoadingMonitor(isLoading, 'advanced-form', 'Procesando...');
  
  const handleSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      updateLoadingMessage('Validando datos...');
      await validate(data);
      
      updateLoadingMessage('Guardando en el servidor...');
      await save(data);
      
      updateLoadingMessage('Sincronizando con la nube...');
      await sync(data);
      
      alert('Todo completado!');
    } catch (error) {
      // Mantener pantalla de loading visible durante el error
      updateLoadingMessage('Error: ' + error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return <button onClick={() => handleSubmit(formData)}>Guardar</button>;
}
```

### 10. Testing del Sistema

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { GlobalLoadingProvider } from '../contexts/GlobalLoadingContext';
import GlobalLoadingScreen from '../components/GlobalLoadingScreen';

describe('Global Loading System', () => {
  test('debe mostrar pantalla después de 3 segundos', async () => {
    const TestComponent = () => {
      const [isLoading, setIsLoading] = useState(false);
      useLoadingMonitor(isLoading, 'test', 'Testing...');
      
      return (
        <button onClick={() => setIsLoading(true)}>
          Start Loading
        </button>
      );
    };
    
    render(
      <GlobalLoadingProvider>
        <TestComponent />
        <GlobalLoadingScreen />
      </GlobalLoadingProvider>
    );
    
    const button = screen.getByText('Start Loading');
    act(() => button.click());
    
    // No debe aparecer inmediatamente
    expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
    
    // Debe aparecer después de 3 segundos
    await waitFor(() => {
      expect(screen.getByText('Testing...')).toBeInTheDocument();
    }, { timeout: 3500 });
  });
});
```

## 🎨 Personalización Avanzada

### Cambiar Colores

```javascript
// En GlobalLoadingScreen.js
const customColors = {
  primary: '#41e0b3',
  secondary: '#2bbd8c',
  background: 'rgba(0, 0, 0, 0.6)'
};
```

### Animaciones Personalizadas

```javascript
// Agregar en GlobalLoadingScreen.js
<style jsx>{`
  @keyframes custom-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .custom-spinner {
    animation: custom-bounce 1s ease-in-out infinite;
  }
`}</style>
```

## 📊 Monitoreo y Debug

```javascript
// Activar logs detallados
localStorage.setItem('DEBUG_LOADING', 'true');

// Ver todos los loadings activos
console.log(loadingTimersRef.current.size);

// Forzar desactivación de emergencia
window.forceStopLoading = () => {
  setGlobalLoadingState(false);
};
```

---

**Nota:** Todos estos ejemplos están listos para usar. Solo copia y adapta según tus necesidades.
