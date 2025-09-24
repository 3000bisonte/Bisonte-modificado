// Security utilities for authentication and rate limiting
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../libs/prisma';

// Rate limiting storage (in-memory, consider Redis for production)
const rateLimitStore = new Map();

/**
 * Enhanced rate limiting with IP and user-based limits
 * @param {string} identifier - IP or user identifier
 * @param {string} action - Action type (login, recovery, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} Rate limit status and info
 */
export async function checkRateLimit(identifier, action = 'default', maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  
  let record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
      firstAttempt: now
    };
  }
  
  record.count += 1;
  rateLimitStore.set(key, record);
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupRateLimit();
  }
  
  const isAllowed = record.count <= maxAttempts;
  const resetIn = Math.ceil((record.resetAt - now) / 1000 / 60); // minutes
  
  return {
    allowed: isAllowed,
    count: record.count,
    limit: maxAttempts,
    resetIn,
    resetAt: record.resetAt
  };
}

/**
 * Advanced rate limiting for login attempts (IP + Email combined)
 * @param {string} ip - Client IP address
 * @param {string} email - User email (optional)
 * @returns {object} Combined rate limit check
 */
export async function checkLoginRateLimit(ip, email = null) {
  const ipLimit = await checkRateLimit(ip, 'login_ip', 20, 15 * 60 * 1000); // 20 per 15min per IP
  const emailLimit = email ? await checkRateLimit(email, 'login_email', 5, 15 * 60 * 1000) : { allowed: true }; // 5 per 15min per email
  
  const isAllowed = ipLimit.allowed && emailLimit.allowed;
  
  if (!isAllowed) {
    const blockReason = !ipLimit.allowed ? 'IP' : 'EMAIL';
    const resetIn = !ipLimit.allowed ? ipLimit.resetIn : emailLimit.resetIn;
    
    throw new Error(`Demasiados intentos desde esta ${blockReason === 'IP' ? 'dirección IP' : 'cuenta'}. Intenta en ${resetIn} minutos.`);
  }
  
  return { ipLimit, emailLimit };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} Secure token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate 6-digit recovery code
 * @returns {string} 6-digit code
 */
export function generateRecoveryCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash password with bcrypt
 * @param {string} password - Plain password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether password is valid
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength with detailed scoring
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength score
 */
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasNoCommonPatterns = !/(123|abc|password|qwerty|admin)/i.test(password);
  
  // Calculate strength score (0-100)
  let score = 0;
  if (password.length >= minLength) score += 20;
  if (password.length >= 12) score += 10;
  if (hasUpperCase) score += 15;
  if (hasLowerCase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecialChar) score += 15;
  if (hasNoCommonPatterns) score += 10;
  
  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  
  let strengthText = 'Muy débil';
  if (score >= 80) strengthText = 'Muy fuerte';
  else if (score >= 60) strengthText = 'Fuerte';
  else if (score >= 40) strengthText = 'Moderada';
  else if (score >= 20) strengthText = 'Débil';
  
  return {
    isValid,
    score,
    strength: strengthText,
    errors: [
      ...(password.length < minLength ? [`Mínimo ${minLength} caracteres`] : []),
      ...(!hasUpperCase ? ['Una letra mayúscula'] : []),
      ...(!hasLowerCase ? ['Una letra minúscula'] : []),
      ...(!hasNumbers ? ['Un número'] : []),
      ...(!hasSpecialChar ? ['Un carácter especial'] : []),
      ...(!hasNoCommonPatterns ? ['Evita patrones comunes'] : [])
    ]
  };
}

/**
 * Hash token for storage (prevents rainbow table attacks)
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create password recovery record
 * @param {string} email - User email
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<object>} Recovery data
 */
export async function createPasswordRecovery(email, ipAddress, userAgent) {
  const token = generateSecureToken(32);
  const code = generateRecoveryCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  // Find user (optional, for better tracking)
  const user = await prisma.usuarios.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  // Create recovery record
  const recovery = await prisma.passwordReset.create({
    data: {
      userId: user?.id,
      email: email.toLowerCase(),
      token: hashToken(token),
      code,
      expiresAt,
      ipAddress,
      userAgent
    }
  });
  
  return {
    token,
    code,
    expiresAt,
    recoveryId: recovery.id
  };
}

/**
 * Verify and consume recovery code
 * @param {string} email - User email
 * @param {string} code - Recovery code
 * @returns {Promise<object|null>} Recovery record if valid
 */
export async function verifyRecoveryCode(email, code) {
  const recovery = await prisma.passwordReset.findFirst({
    where: {
      email: email.toLowerCase(),
      code,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    }
  });
  
  if (!recovery) {
    return null;
  }
  
  // Mark as used
  await prisma.passwordReset.update({
    where: { id: recovery.id },
    data: { used: true }
  });
  
  return recovery;
}

/**
 * Clean up expired recovery codes
 */
export async function cleanupExpiredRecovery() {
  await prisma.passwordReset.deleteMany({
    where: {
      OR: [
        { used: true },
        { expiresAt: { lt: new Date() } },
        { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 24 hours old
      ]
    }
  });
}

/**
 * Get client IP from request
 * @param {Request} req - Request object
 * @returns {string} Client IP address
 */
export function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || cfIP || 'unknown';
}

/**
 * Get client user agent
 * @param {Request} req - Request object
 * @returns {string} User agent string
 */
export function getClientUserAgent(req) {
  return req.headers.get('user-agent') || 'unknown';
}
