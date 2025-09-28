// 🛡️ Hook personalizado para manejo robusto de estados y errores
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthProvider';

/**
 * 📊 Estados posibles para operaciones
 */
export const OperationStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * 🔧 Hook para manejo de estado de operaciones asíncronas
 */
export function useAsyncOperation(options = {}) {
  const {
    onSuccess = null,
    onError = null,
    showSuccessToast = true,
    showErrorToast = true,
    resetAfter = 3000,
    retryAttempts = 0
  } = options;

  const [state, setState] = useState(OperationStates.IDLE);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  const timeoutRef = useRef(null);
  const { logout } = useAuth();

  /**
   * 🚀 Ejecutar operación asíncrona
   */
  const execute = useCallback(async (asyncFunction, ...args) => {
    try {
      setState(OperationStates.LOADING);
      setError(null);
      
      const result = await asyncFunction(...args);
      
      setState(OperationStates.SUCCESS);
      setData(result);
      setAttempts(0);
      
      if (showSuccessToast && result?.message) {
        toast.success(result.message, { icon: '✅' });
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Auto reset después del tiempo especificado
      if (resetAfter > 0) {
        timeoutRef.current = setTimeout(() => {
          setState(OperationStates.IDLE);
          setData(null);
        }, resetAfter);
      }
      
      return result;
      
    } catch (error) {
      console.error('[AsyncOperation] Error:', error);
      
      setState(OperationStates.ERROR);
      setError(error);
      
      // Manejar errores específicos
      await handleError(error);
      
      if (onError) {
        onError(error);
      }
      
      // Retry logic
      if (retryAttempts > 0 && attempts < retryAttempts) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        console.log(`[AsyncOperation] Retrying... Attempt ${newAttempts}/${retryAttempts}`);
        
        setTimeout(() => {
          execute(asyncFunction, ...args);
        }, 1000 * newAttempts); // Exponential backoff
        
        return;
      }
      
      throw error;
    }
  }, [
    attempts, 
    onSuccess, 
    onError, 
    showSuccessToast, 
    showErrorToast, 
    resetAfter, 
    retryAttempts,
    logout
  ]);

  /**
   * 🚨 Manejar diferentes tipos de errores
   */
  const handleError = useCallback(async (error) => {
    let errorMessage = 'Ha ocurrido un error inesperado';
    let shouldLogout = false;
    
    // Errores de red
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    // Errores HTTP
    else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = error.message || 'Datos inválidos enviados al servidor';
          break;
        case 401:
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente.';
          shouldLogout = true;
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 409:
          errorMessage = error.message || 'Conflicto: el recurso ya existe';
          break;
        case 422:
          errorMessage = error.message || 'Datos de entrada inválidos';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        default:
          errorMessage = error.message || `Error del servidor (${error.status})`;
      }
    }
    
    // Errores específicos de la aplicación
    else if (error.code) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          errorMessage = error.details?.map(d => d.message).join(', ') || error.message;
          break;
        case 'AUTHENTICATION_FAILED':
          errorMessage = 'Credenciales inválidas';
          break;
        case 'AUTHORIZATION_FAILED':
          errorMessage = 'No tienes permisos suficientes';
          break;
        case 'SESSION_EXPIRED':
          errorMessage = 'Tu sesión ha expirado';
          shouldLogout = true;
          break;
        case 'ACCOUNT_LOCKED':
          errorMessage = 'Tu cuenta ha sido bloqueada temporalmente';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }
    
    // Mostrar toast de error si está habilitado
    if (showErrorToast) {
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌'
      });
    }
    
    // Logout si es necesario
    if (shouldLogout) {
      setTimeout(() => {
        logout('session_expired');
      }, 2000);
    }
    
  }, [showErrorToast, logout]);

  /**
   * 🔄 Reset manual del estado
   */
  const reset = useCallback(() => {
    setState(OperationStates.IDLE);
    setData(null);
    setError(null);
    setAttempts(0);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  /**
   * 🧹 Cleanup en unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    data,
    error,
    attempts,
    isLoading: state === OperationStates.LOADING,
    isSuccess: state === OperationStates.SUCCESS,
    isError: state === OperationStates.ERROR,
    isIdle: state === OperationStates.IDLE,
    execute,
    reset
  };
}

/**
 * 📡 Hook especializado para llamadas a API con validación
 */
export function useApiCall(baseUrl = '/api') {
  const { user } = useAuth();
  const operation = useAsyncOperation({
    showSuccessToast: false, // Manejar manualmente
    retryAttempts: 2
  });

  /**
   * 🔐 Hacer llamada a API con headers de seguridad
   */
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const {
      method = 'GET',
      body = null,
      headers = {},
      validateResponse = true,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    };

    // Agregar user ID si está autenticado (para auditoría)
    if (user?.id) {
      requestHeaders['X-User-ID'] = user.id;
    }

    const requestOptions = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      ...fetchOptions
    };

    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const error = new Error(responseData?.error || responseData || 'Request failed');
      error.status = response.status;
      error.code = responseData?.code;
      error.details = responseData?.details;
      throw error;
    }

    // Validación básica de respuesta si está habilitada
    if (validateResponse && typeof responseData === 'object') {
      if (responseData.error) {
        const error = new Error(responseData.error);
        error.code = responseData.code;
        error.details = responseData.details;
        throw error;
      }
    }

    return responseData;
  }, [baseUrl, user]);

  /**
   * 🚀 Métodos de conveniencia para diferentes HTTP methods
   */
  const get = useCallback((endpoint, options = {}) => 
    operation.execute(apiCall, endpoint, { method: 'GET', ...options }), 
    [operation.execute, apiCall]
  );

  const post = useCallback((endpoint, data, options = {}) => 
    operation.execute(apiCall, endpoint, { method: 'POST', body: data, ...options }), 
    [operation.execute, apiCall]
  );

  const put = useCallback((endpoint, data, options = {}) => 
    operation.execute(apiCall, endpoint, { method: 'PUT', body: data, ...options }), 
    [operation.execute, apiCall]
  );

  const del = useCallback((endpoint, options = {}) => 
    operation.execute(apiCall, endpoint, { method: 'DELETE', ...options }), 
    [operation.execute, apiCall]
  );

  return {
    ...operation,
    get,
    post,
    put,
    delete: del,
    apiCall: (endpoint, options) => operation.execute(apiCall, endpoint, options)
  };
}

/**
 * 📝 Hook para manejo de formularios con validación
 */
export function useForm(initialValues = {}, options = {}) {
  const {
    validationSchema = null,
    onSubmit = null,
    resetAfterSubmit = false
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const submitOperation = useAsyncOperation();

  /**
   * 📝 Actualizar valor de campo
   */
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * 👆 Marcar campo como tocado
   */
  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  /**
   * ✅ Validar formulario
   */
  const validate = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error.errors) {
        const validationErrors = {};
        error.errors.forEach(err => {
          const field = err.path[0];
          validationErrors[field] = err.message;
        });
        setErrors(validationErrors);
      }
      return false;
    }
  }, [values, validationSchema]);

  /**
   * 📤 Manejar envío del formulario
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    // Marcar todos los campos como tocados
    const allFields = Object.keys(values);
    const touchedState = {};
    allFields.forEach(field => {
      touchedState[field] = true;
    });
    setTouched(touchedState);

    // Validar
    if (!validate()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    if (onSubmit) {
      try {
        await submitOperation.execute(onSubmit, values);
        
        if (resetAfterSubmit) {
          setValues(initialValues);
          setTouched({});
          setErrors({});
        }
      } catch (error) {
        // El error ya se maneja en useAsyncOperation
      }
    }
  }, [values, validate, onSubmit, submitOperation.execute, resetAfterSubmit, initialValues]);

  /**
   * 🔄 Reset formulario
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    submitOperation.reset();
  }, [initialValues, submitOperation.reset]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit,
    reset,
    isSubmitting: submitOperation.isLoading,
    submitError: submitOperation.error,
    isValid: Object.keys(errors).length === 0
  };
}

export default useAsyncOperation;