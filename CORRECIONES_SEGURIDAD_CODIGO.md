# 🛡️ CORRECCIONES DE SEGURIDAD - CÓDIGO LISTO PARA IMPLEMENTAR

## 📌 ÍNDICE DE CORRECCIONES

1. [Servicio de Almacenamiento Cifrado](#1-servicio-de-almacenamiento-cifrado)
2. [Modal Seguro de Contraseña](#2-modal-seguro-de-contraseña)
3. [Protección CSRF](#3-protección-csrf)
4. [Validación Mejorada de Passwords](#4-validación-mejorada-de-passwords)
5. [Sanitización de Inputs](#5-sanitización-de-inputs)
6. [Logger Seguro](#6-logger-seguro)
7. [Storage con Expiración](#7-storage-con-expiración)

---

## 1. SERVICIO DE ALMACENAMIENTO CIFRADO

### 📁 Crear: `src/lib/secureStorage.js`

```javascript
/**
 * 🔒 Servicio de almacenamiento seguro con cifrado AES
 * Cifra datos sensibles antes de guardarlos en localStorage
 */

import CryptoJS from 'crypto-js';

// Clave de cifrado - DEBE estar en variables de entorno
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY || 'bisonte-default-key-2024';

/**
 * Verifica si la clave de cifrado es segura
 */
const isSecureKey = () => {
  if (ENCRYPTION_KEY === 'bisonte-default-key-2024') {
    console.warn('⚠️ [SecureStorage] Usando clave de cifrado por defecto. Configura NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY en producción.');
    return false;
  }
  return ENCRYPTION_KEY.length >= 32;
};

/**
 * Servicio de almacenamiento seguro
 */
export const SecureStorage = {
  /**
   * Guarda un valor cifrado en localStorage
   */
  setItem: (key, value, options = {}) => {
    try {
      // Validar clave de cifrado
      if (!isSecureKey() && process.env.NODE_ENV === 'production') {
        throw new Error('Clave de cifrado insegura en producción');
      }

      const dataToEncrypt = {
        value: value,
        timestamp: Date.now(),
        expiry: options.ttl ? Date.now() + options.ttl : null
      };

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(dataToEncrypt), 
        ENCRYPTION_KEY
      ).toString();

      localStorage.setItem(key, encrypted);
      console.log(`🔒 [SecureStorage] Guardado cifrado: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ [SecureStorage] Error al guardar ${key}:`, error);
      return false;
    }
  },

  /**
   * Obtiene y descifra un valor de localStorage
   */
  getItem: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        console.error(`❌ [SecureStorage] No se pudo descifrar ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      const data = JSON.parse(decryptedStr);

      // Verificar expiración
      if (data.expiry && Date.now() > data.expiry) {
        console.log(`⏰ [SecureStorage] Dato expirado: ${key}`);
        localStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error(`❌ [SecureStorage] Error al leer ${key}:`, error);
      // Si falla el descifrado, eliminar el dato corrupto
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Elimina un elemento
   */
  removeItem: (key) => {
    localStorage.removeItem(key);
    console.log(`🗑️ [SecureStorage] Eliminado: ${key}`);
  },

  /**
   * Limpia todos los elementos
   */
  clear: () => {
    localStorage.clear();
    console.log(`🧹 [SecureStorage] Storage limpiado completamente`);
  },

  /**
   * Verifica si un elemento existe y no ha expirado
   */
  hasItem: (key) => {
    const value = SecureStorage.getItem(key);
    return value !== null;
  }
};

/**
 * Hook de React para usar SecureStorage
 */
export function useSecureStorage(key, initialValue = null) {
  const [storedValue, setStoredValue] = React.useState(() => {
    return SecureStorage.getItem(key) || initialValue;
  });

  const setValue = (value, ttl = null) => {
    setStoredValue(value);
    SecureStorage.setItem(key, value, { ttl });
  };

  const removeValue = () => {
    setStoredValue(null);
    SecureStorage.removeItem(key);
  };

  return [storedValue, setValue, removeValue];
}

export default SecureStorage;
```

### 📦 Instalar dependencia

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

### 🔧 Agregar variable de entorno

En `.env.local`:
```env
# Clave de cifrado para storage (32+ caracteres)
NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY=tu-clave-super-secreta-de-32-caracteres-o-mas
```

### 🔄 Migrar código existente

**Antes:**
```javascript
// src/app/register/page.js
localStorage.setItem("nombreRegistro", nombre);
localStorage.setItem("emailRegistro", email);
```

**Después:**
```javascript
import SecureStorage from '@/lib/secureStorage';

// Guardar con expiración de 5 minutos
SecureStorage.setItem("nombreRegistro", nombre, { ttl: 5 * 60 * 1000 });
SecureStorage.setItem("emailRegistro", email, { ttl: 5 * 60 * 1000 });
```

**Leer:**
```javascript
const nombre = SecureStorage.getItem("nombreRegistro");
const email = SecureStorage.getItem("emailRegistro");
```

---

## 2. MODAL SEGURO DE CONTRASEÑA

### 📁 Crear: `src/components/PasswordModal.jsx`

```javascript
"use client";

import { useState } from 'react';

/**
 * Modal seguro para solicitar contraseña
 * Reemplaza el uso inseguro de prompt()
 */
export default function PasswordModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  email = '',
  title = 'Confirma tu contraseña',
  placeholder = 'Contraseña'
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    onConfirm(password);
    setPassword(''); // Limpiar después de enviar
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            {email && (
              <p className="text-sm text-gray-600">
                Usuario: <span className="font-semibold text-[#41e0b3]">{email}</span>
              </p>
            )}
          </div>

          {/* Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={placeholder}
                autoFocus
                autoComplete="current-password"
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  error ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-[#41e0b3] focus:border-transparent`}
              />
              
              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#41e0b3] text-white font-bold py-3 rounded-lg hover:bg-[#2bbd8c] transition focus:outline-none focus:ring-2 focus:ring-[#41e0b3] focus:ring-offset-2"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 🔄 Reemplazar en `src/app/registro-exitoso/page.js`

**Antes:**
```javascript
const password = prompt(`Por favor, ingresa tu contraseña...`);
```

**Después:**
```javascript
import PasswordModal from '@/components/PasswordModal';

export default function RegistroExitoso() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const handleIrAHome = () => {
    setShowPasswordModal(true);
  };
  
  const handlePasswordConfirm = async (password) => {
    setShowPasswordModal(false);
    setLoading(true);
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password: password,
      });
      
      if (res?.ok) {
        localStorage.removeItem("nombreRegistro");
        localStorage.removeItem("emailRegistro");
        router.push("/home");
      } else {
        alert("Error al iniciar sesión. Verifica tu contraseña.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* ... resto del JSX ... */}
      
      <PasswordModal
        isOpen={showPasswordModal}
        onConfirm={handlePasswordConfirm}
        onCancel={() => setShowPasswordModal(false)}
        email={email}
        title="Iniciar sesión"
      />
    </div>
  );
}
```

---

## 3. PROTECCIÓN CSRF

### 📁 Crear: `src/lib/csrf.js`

```javascript
/**
 * 🛡️ Utilidades para protección CSRF
 */

import { randomBytes } from 'crypto';

/**
 * Genera un token CSRF único
 */
export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Verifica que el token CSRF sea válido
 */
export function verifyCsrfToken(token, storedToken) {
  if (!token || !storedToken) {
    return false;
  }
  
  // Comparación constante en tiempo para prevenir timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}
```

### 📁 Crear: `src/app/api/csrf/route.js`

```javascript
import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  
  const token = generateCsrfToken();
  
  // Guardar token en sesión o base de datos
  // Para este ejemplo, lo devolvemos directamente
  // En producción, deberías guardarlo en Redis o DB
  
  return NextResponse.json({ 
    csrfToken: token,
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hora
  });
}
```

### 🔧 Hook para usar CSRF en cliente

```javascript
// src/hooks/useCsrf.js
import { useState, useEffect } from 'react';

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => {
        setCsrfToken(data.csrfToken);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error obteniendo CSRF token:', err);
        setLoading(false);
      });
  }, []);
  
  return { csrfToken, loading };
}
```

### 🔄 Usar en formularios

```javascript
// src/app/register/page.js
import { useCsrf } from '@/hooks/useCsrf';

export default function Register() {
  const { csrfToken, loading: csrfLoading } = useCsrf();
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!csrfToken) {
      setMsg("Error de seguridad. Recarga la página.");
      return;
    }
    
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ nombre, email, password }),
    });
    // ...
  };
  
  return (
    <form onSubmit={handleRegister}>
      {csrfLoading && <p>Cargando...</p>}
      {/* resto del formulario */}
    </form>
  );
}
```

---

## 4. VALIDACIÓN MEJORADA DE PASSWORDS

### 📁 Crear: `src/lib/passwordValidator.js`

```javascript
/**
 * 🔐 Validador robusto de contraseñas
 */

/**
 * Requisitos de contraseña segura
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  minEntropy: 40 // bits de entropía
};

/**
 * Lista de contraseñas comunes a rechazar
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

/**
 * Calcula la entropía de una contraseña
 */
function calculateEntropy(password) {
  const charsets = {
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    numbers: /[0-9]/,
    special: /[^a-zA-Z0-9]/
  };
  
  let poolSize = 0;
  if (charsets.lowercase.test(password)) poolSize += 26;
  if (charsets.uppercase.test(password)) poolSize += 26;
  if (charsets.numbers.test(password)) poolSize += 10;
  if (charsets.special.test(password)) poolSize += 32;
  
  return password.length * Math.log2(poolSize);
}

/**
 * Valida una contraseña según requisitos de seguridad
 */
export function validatePassword(password) {
  const errors = [];
  const warnings = [];
  
  // Validar longitud
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  }
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`La contraseña no debe exceder ${PASSWORD_REQUIREMENTS.maxLength} caracteres`);
  }
  
  // Validar complejidad
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una letra mayúscula');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una letra minúscula');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Debe incluir al menos un número');
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Debe incluir al menos un caracter especial (!@#$%^&*...)');
  }
  
  // Verificar contraseñas comunes
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    errors.push('Esta contraseña es muy común y fácil de adivinar');
  }
  
  // Verificar secuencias
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Evita repetir el mismo caracter consecutivamente');
  }
  if (/123|234|345|456|567|678|789|890/.test(password)) {
    warnings.push('Evita secuencias numéricas predecibles');
  }
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    warnings.push('Evita secuencias alfabéticas');
  }
  
  // Calcular entropía
  const entropy = calculateEntropy(password);
  if (entropy < PASSWORD_REQUIREMENTS.minEntropy) {
    warnings.push(`Contraseña débil. Intenta usar más variedad de caracteres (entropía: ${entropy.toFixed(1)} bits)`);
  }
  
  // Determinar fortaleza
  let strength = 'weak';
  if (errors.length === 0) {
    if (entropy >= 80) strength = 'strong';
    else if (entropy >= 60) strength = 'good';
    else if (entropy >= 40) strength = 'fair';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    entropy: entropy.toFixed(1)
  };
}

/**
 * Genera una contraseña segura aleatoria
 */
export function generateSecurePassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + special;
  let password = '';
  
  // Asegurar al menos un caracter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Rellenar el resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

### 🔄 Usar en formulario de registro

```javascript
// src/app/register/page.js
import { validatePassword } from '@/lib/passwordValidator';

const [passwordStrength, setPasswordStrength] = useState(null);

const handlePasswordChange = (e) => {
  const newPassword = e.target.value;
  setPassword(newPassword);
  
  if (newPassword.length >= 6) {
    const validation = validatePassword(newPassword);
    setPasswordStrength(validation);
    
    if (!validation.isValid) {
      setPasswordError(validation.errors[0]);
    } else if (validation.warnings.length > 0) {
      setPasswordError(''); // Sin errores bloqueantes
    } else {
      setPasswordError('');
    }
  }
};

// En el JSX:
<div>
  <input
    type="password"
    value={password}
    onChange={handlePasswordChange}
    onBlur={handlePasswordBlur}
  />
  
  {/* Indicador de fortaleza */}
  {passwordStrength && (
    <div className="mt-2">
      <div className="flex gap-1">
        <div className={`h-1 flex-1 rounded ${
          passwordStrength.strength === 'weak' ? 'bg-red-500' :
          passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
          passwordStrength.strength === 'good' ? 'bg-blue-500' :
          'bg-green-500'
        }`} />
      </div>
      <p className="text-xs mt-1">
        Fortaleza: {passwordStrength.strength === 'weak' ? 'Débil' :
                    passwordStrength.strength === 'fair' ? 'Aceptable' :
                    passwordStrength.strength === 'good' ? 'Buena' : 'Fuerte'}
      </p>
      {passwordStrength.warnings.length > 0 && (
        <p className="text-xs text-yellow-600 mt-1">
          {passwordStrength.warnings[0]}
        </p>
      )}
    </div>
  )}
</div>
```

---

## 5. SANITIZACIÓN DE INPUTS

### 📁 Crear: `src/lib/sanitize.js`

```javascript
/**
 * 🧹 Utilidades de sanitización de inputs
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza texto eliminando HTML y scripts
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return input;
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitiza número de teléfono
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  return phone
    .trim()
    .replace(/[^0-9+]/g, '');
}

/**
 * Sanitiza nombre (solo letras, espacios y acentos)
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Escapa caracteres HTML
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitiza objeto completo recursivamente
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeText(obj);
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = sanitizeText(obj[key]);
      }
    }
  }
  return sanitized;
}
```

### 📦 Instalar dependencia

```bash
npm install isomorphic-dompurify
```

### 🔄 Usar en formularios

```javascript
// src/app/register/page.js
import { sanitizeName, sanitizeEmail, sanitizePhone } from '@/lib/sanitize';

const handleRegister = async (e) => {
  e.preventDefault();
  
  // Sanitizar todos los inputs antes de enviar
  const sanitizedData = {
    nombre: sanitizeName(nombre),
    celular: sanitizePhone(celular),
    ciudad: sanitizeName(ciudad),
    email: sanitizeEmail(email),
    password: password // No sanitizar password, solo validar
  };
  
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedData),
  });
  // ...
};
```

---

## 6. LOGGER SEGURO

### 📁 Crear: `src/lib/logger.js`

```javascript
/**
 * 📝 Sistema de logging seguro
 * Previene logging de datos sensibles
 */

const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'apiKey', 'api_key',
  'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'privateKey', 'private_key', 'creditCard', 'cvv', 'ssn'
];

/**
 * Redacta datos sensibles de un objeto
 */
function redactSensitiveData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  const redacted = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sensitive => 
        lowerKey.includes(sensitive)
      );
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object') {
        redacted[key] = redactSensitiveData(data[key]);
      } else {
        redacted[key] = data[key];
      }
    }
  }
  return redacted;
}

/**
 * Logger seguro
 */
export const Logger = {
  /**
   * Log de información
   */
  info: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`ℹ️ [INFO] ${message}`, safeData);
    }
  },
  
  /**
   * Log de advertencia
   */
  warn: (message, data = null) => {
    const safeData = data ? redactSensitiveData(data) : '';
    console.warn(`⚠️ [WARN] ${message}`, safeData);
  },
  
  /**
   * Log de error
   */
  error: (message, error = null) => {
    const safeError = error ? {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name
    } : '';
    
    console.error(`❌ [ERROR] ${message}`, safeError);
    
    // En producción, enviar a servicio de monitoring
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Ejemplo con Sentry:
      // Sentry.captureException(error, { tags: { message } });
    }
  },
  
  /**
   * Log de éxito
   */
  success: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`✅ [SUCCESS] ${message}`, safeData);
    }
  },
  
  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const safeData = data ? redactSensitiveData(data) : '';
      console.log(`🐛 [DEBUG] ${message}`, safeData);
    }
  }
};

export default Logger;
```

### 🔄 Reemplazar console.log existentes

**Antes:**
```javascript
console.log("✅ [Registro] Usuario registrado:", { nombre, email, password });
```

**Después:**
```javascript
import Logger from '@/lib/logger';

Logger.success("Usuario registrado", { nombre, email }); // password automáticamente redactada
```

---

## 7. STORAGE CON EXPIRACIÓN

### 📁 Crear: `src/lib/temporaryStorage.js`

```javascript
/**
 * ⏰ Storage temporal con expiración automática
 * Útil para datos de registro, recuperación de contraseña, etc.
 */

export const TemporaryStorage = {
  /**
   * Guarda un valor con tiempo de expiración
   */
  set: (key, value, ttlMinutes = 5) => {
    const item = {
      value: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    try {
      sessionStorage.setItem(key, JSON.stringify(item));
      console.log(`⏰ [TempStorage] Guardado con TTL de ${ttlMinutes}min: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ [TempStorage] Error guardando ${key}:`, error);
      return false;
    }
  },
  
  /**
   * Obtiene un valor si no ha expirado
   */
  get: (key) => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      const now = Date.now();
      
      if (now > item.expiresAt) {
        console.log(`⏰ [TempStorage] Expirado: ${key}`);
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error(`❌ [TempStorage] Error leyendo ${key}:`, error);
      sessionStorage.removeItem(key);
      return null;
    }
  },
  
  /**
   * Verifica si un valor existe y no ha expirado
   */
  has: (key) => {
    return TemporaryStorage.get(key) !== null;
  },
  
  /**
   * Elimina un valor
   */
  remove: (key) => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ [TempStorage] Eliminado: ${key}`);
  },
  
  /**
   * Limpia todos los valores expirados
   */
  cleanup: () => {
    let cleaned = 0;
    const now = Date.now();
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      
      try {
        const itemStr = sessionStorage.getItem(key);
        const item = JSON.parse(itemStr);
        
        if (item.expiresAt && now > item.expiresAt) {
          sessionStorage.removeItem(key);
          cleaned++;
          i--; // Ajustar índice porque removimos un item
        }
      } catch (error) {
        // Item no es del formato temporal, ignorar
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [TempStorage] Limpiados ${cleaned} items expirados`);
    }
  },
  
  /**
   * Obtiene el tiempo restante en milisegundos
   */
  getTimeRemaining: (key) => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return 0;
      
      const item = JSON.parse(itemStr);
      const remaining = item.expiresAt - Date.now();
      
      return Math.max(0, remaining);
    } catch (error) {
      return 0;
    }
  }
};

// Ejecutar cleanup periódicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    TemporaryStorage.cleanup();
  }, 60 * 1000); // Cada minuto
}

export default TemporaryStorage;
```

### 🔄 Usar para datos de registro

```javascript
// src/app/register/page.js
import TemporaryStorage from '@/lib/temporaryStorage';

// Guardar con expiración de 5 minutos
TemporaryStorage.set("registrationData", {
  nombre,
  email
}, 5);

// Leer
const data = TemporaryStorage.get("registrationData");
if (data) {
  console.log("Datos válidos:", data);
} else {
  console.log("Datos expirados o no encontrados");
}

// Verificar tiempo restante
const remaining = TemporaryStorage.getTimeRemaining("registrationData");
console.log(`Expira en ${Math.floor(remaining / 1000)} segundos`);
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Prioridad Alta (Esta semana)

- [ ] Instalar dependencias: `crypto-js`, `isomorphic-dompurify`
- [ ] Crear `src/lib/secureStorage.js`
- [ ] Crear `src/lib/temporaryStorage.js`
- [ ] Crear `src/lib/logger.js`
- [ ] Crear `src/components/PasswordModal.jsx`
- [ ] Migrar datos sensibles a SecureStorage
- [ ] Reemplazar `prompt()` por PasswordModal
- [ ] Implementar sanitización en formularios
- [ ] Reemplazar console.log por Logger

### Prioridad Media (Próxima semana)

- [ ] Crear `src/lib/csrf.js`
- [ ] Crear `src/app/api/csrf/route.js`
- [ ] Crear `src/hooks/useCsrf.js`
- [ ] Implementar CSRF en formularios
- [ ] Crear `src/lib/passwordValidator.js`
- [ ] Integrar indicador de fortaleza de password

### Testing

- [ ] Test unitarios de SecureStorage
- [ ] Test de sanitización
- [ ] Test de validación de password
- [ ] Test E2E de flujo de registro
- [ ] Test de limpieza de datos temporales

---

## 🚀 DEPLOYMENT

### Antes de deploy

1. Agregar variable de entorno en Vercel:
   ```
   NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY=<tu-clave-de-32+-caracteres>
   ```

2. Verificar que `.env` y `.env.local` estén en `.gitignore`

3. Limpiar historial de Git si es necesario

4. Testing completo en staging

---

*Documento de correcciones creado el 2 de Noviembre de 2025*
