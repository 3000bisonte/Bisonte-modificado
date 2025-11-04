/**
 * 🔐 Validador robusto de contraseñas
 * Implementa validación de complejidad, entropía y prevención de contraseñas comunes
 */

/**
 * Requisitos de contraseña segura
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Opcional para mejor UX
  minEntropy: 35 // bits de entropía mínima
};

/**
 * Lista de contraseñas comunes a rechazar
 * Top 100 contraseñas más usadas según investigaciones de seguridad
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123', '123456789',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
  'welcome', 'jesus', 'ninja', 'mustang', 'password1', 'admin', 'adobe',
  'photoshop', '1234567', 'princess', 'azerty', 'trustno', '000000'
];

/**
 * Calcula la entropía de Shannon de una contraseña
 * @param {string} password - Contraseña a evaluar
 * @returns {number} Entropía en bits
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
  
  if (poolSize === 0) return 0;
  
  return password.length * Math.log2(poolSize);
}

/**
 * Detecta patrones comunes y secuencias
 * @param {string} password - Contraseña a evaluar
 * @returns {Array<string>} Lista de patrones detectados
 */
function detectPatterns(password) {
  const patterns = [];
  
  // Caracteres repetidos
  if (/(.)\1{2,}/.test(password)) {
    patterns.push('Contiene caracteres repetidos consecutivamente');
  }
  
  // Secuencias numéricas
  if (/(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
    patterns.push('Contiene secuencias numéricas predecibles');
  }
  
  // Secuencias alfabéticas
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|zyx|yxw|xwv|wvu|vut|uts|tsr|srq|rqp|qpo|pon|onm|nml|mlk|lkj|kji|jih|ihg|hgf|gfe|fed|edc|dcb|cba)/i.test(password)) {
    patterns.push('Contiene secuencias alfabéticas');
  }
  
  // Teclado QWERTY
  if (/(?:qwerty|asdfgh|zxcvbn|qazwsx|789456|147258)/i.test(password)) {
    patterns.push('Contiene patrones de teclado QWERTY');
  }
  
  return patterns;
}

/**
 * Valida una contraseña según requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} Resultado de la validación
 */
export function validatePassword(password) {
  const errors = [];
  const warnings = [];
  
  // Validar que password sea string
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['La contraseña debe ser una cadena de texto'],
      warnings: [],
      strength: 'invalid',
      entropy: 0
    };
  }
  
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
  
  // Verificar contraseñas comunes (case insensitive)
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    errors.push('Esta contraseña es muy común y fácil de adivinar');
  }
  
  // Detectar patrones
  const patterns = detectPatterns(password);
  patterns.forEach(pattern => warnings.push(pattern));
  
  // Calcular entropía
  const entropy = calculateEntropy(password);
  if (entropy < PASSWORD_REQUIREMENTS.minEntropy && errors.length === 0) {
    warnings.push(`Contraseña débil. Intenta usar más variedad de caracteres (fuerza: ${entropy.toFixed(1)} bits)`);
  }
  
  // Determinar fortaleza (como número para compatibilidad con tests)
  let strength = 0; // weak
  let strengthLabel = 'weak';
  
  if (errors.length === 0) {
    if (entropy >= 80) {
      strength = 4;
      strengthLabel = 'very-strong';
    } else if (entropy >= 60) {
      strength = 3;
      strengthLabel = 'strong';
    } else if (entropy >= 45) {
      strength = 2;
      strengthLabel = 'good';
    } else if (entropy >= 35) {
      strength = 1;
      strengthLabel = 'fair';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength, // número 0-4
    strengthLabel, // string para UI
    entropy: parseFloat(entropy.toFixed(1)),
    patterns
  };
}

/**
 * Genera una contraseña segura aleatoria
 * @param {number} length - Longitud deseada (mínimo 12)
 * @returns {string} Contraseña generada
 */
export function generateSecurePassword(length = 16) {
  const minLength = Math.max(12, length);
  
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
  
  // Rellenar el resto con caracteres aleatorios
  for (let i = password.length; i < minLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar caracteres usando Fisher-Yates shuffle
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
}

/**
 * Obtiene solo la fortaleza de una contraseña (sin validar requisitos)
 * @param {string} password - Contraseña a evaluar
 * @returns {number} Fortaleza 0-4
 */
export function getPasswordStrength(password) {
  const result = validatePassword(password);
  return result.strength;
}

/**
 * Obtiene mensaje de sugerencia basado en la fortaleza
 * @param {number|string} strength - Nivel de fortaleza (0-4 o label)
 * @returns {string} Mensaje de sugerencia
 */
export function getStrengthMessage(strength) {
  // Soporte para ambos formatos: número y string
  const messagesNumeric = {
    0: 'Muy débil - No recomendada',
    1: 'Aceptable - Considera hacerla más fuerte',
    2: 'Buena - Protección adecuada',
    3: 'Fuerte - Excelente protección',
    4: 'Muy fuerte - Máxima seguridad'
  };
  
  const messagesString = {
    'invalid': 'Contraseña inválida',
    'weak': 'Muy débil - No recomendada',
    'fair': 'Aceptable - Considera hacerla más fuerte',
    'good': 'Buena - Protección adecuada',
    'strong': 'Fuerte - Excelente protección',
    'very-strong': 'Muy fuerte - Máxima seguridad'
  };
  
  if (typeof strength === 'number') {
    return messagesNumeric[strength] || 'Desconocida';
  }
  
  return messagesString[strength] || 'Desconocida';
}

/**
 * Obtiene color para indicador visual
 * @param {number|string} strength - Nivel de fortaleza (0-4 o label)
 * @returns {string} Clase de color Tailwind
 */
export function getStrengthColor(strength) {
  // Soporte para ambos formatos: número y string
  const colorsNumeric = {
    0: 'bg-gray-300',
    1: 'bg-red-500',
    2: 'bg-yellow-500',
    3: 'bg-blue-500',
    4: 'bg-green-500'
  };
  
  const colorsString = {
    'invalid': 'bg-gray-300',
    'weak': 'bg-red-500',
    'fair': 'bg-yellow-500',
    'good': 'bg-blue-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-green-600'
  };
  
  if (typeof strength === 'number') {
    return colorsNumeric[strength] || 'bg-gray-300';
  }
  
  return colorsString[strength] || 'bg-gray-300';
}
