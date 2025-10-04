import 'server-only';

// Security utilities for authentication and rate limiting
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import prisma from './prisma.js';

// Rate limiting storage (in-memory, consider Redis for production)
// Each entry keeps a sliding window of attempt timestamps to avoid over-counting bursts
const rateLimitStore = new Map();

const DEFAULT_IDENTIFIER = 'anonymous';
const MAX_RATE_LIMIT_KEYS = 5000;
const CLEANUP_PROBABILITY = 0.05;

/**
 * Enhanced rate limiting with IP and user-based limits
 * @param {string} identifier - IP or user identifier
 * @param {string} action - Action type (login, recovery, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} Rate limit status and info
 */
export async function checkRateLimit(
  identifier,
  action = 'default',
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  options = {}
) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const weight = Math.max(1, Math.floor(options.weight ?? 1));
  const sanitizedAction = typeof action === 'string' && action.trim() ? action.trim() : 'default';
  const sanitizedIdentifier = normalizeIdentifier(identifier);
  const key = `${sanitizedAction}:${sanitizedIdentifier}`;

  let record = rateLimitStore.get(key);

  if (!record) {
    record = {
      attempts: [],
      windowMs,
      lastSeen: now
    };
    rateLimitStore.set(key, record);
  } else {
    record.windowMs = windowMs;
    record.lastSeen = now;
  }

  const windowStart = now - windowMs;
  record.attempts = record.attempts.filter((timestamp) => timestamp > windowStart);

  if (record.attempts.length >= maxAttempts) {
    const resetAt = record.attempts[0] + windowMs;
    return buildRateLimitResponse(false, record.attempts.length, maxAttempts, resetAt, now);
  }

  for (let i = 0; i < weight; i += 1) {
    record.attempts.push(now);
  }

  const resetAt = record.attempts[0] + windowMs;

  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS || Math.random() < CLEANUP_PROBABILITY) {
    cleanupRateLimit(now);
  }

  return buildRateLimitResponse(true, record.attempts.length, maxAttempts, resetAt, now);
}

/**
 * Advanced rate limiting for login attempts (IP + Email combined)
 * @param {string} ip - Client IP address
 * @param {string} email - User email (optional)
 * @returns {object} Combined rate limit check
 */
export async function checkLoginRateLimit(ip, email = null) {
  const normalizedIp = normalizeIdentifier(ip);
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : null;

  const ipLimit = await checkRateLimit(normalizedIp, 'login_ip', 60, 10 * 60 * 1000);
  const emailLimit = normalizedEmail
    ? await checkRateLimit(`email:${normalizedEmail}`, 'login_email', 12, 10 * 60 * 1000)
    : { allowed: true, limit: 0, count: 0, resetIn: 0, resetAt: Date.now() };

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
function cleanupRateLimit(now = Date.now()) {
  for (const [key, record] of rateLimitStore.entries()) {
    if (!record?.attempts?.length) {
      rateLimitStore.delete(key);
      continue;
    }

    const windowMs = record.windowMs ?? 0;
    const windowStart = now - windowMs;
    record.attempts = record.attempts.filter((timestamp) => timestamp > windowStart);

    if (!record.attempts.length || now - (record.lastSeen ?? now) > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

function buildRateLimitResponse(allowed, count, limit, resetAt, now) {
  const deltaMs = resetAt - now;
  const resetInMinutes = deltaMs <= 0 ? 0 : Math.ceil(deltaMs / 1000 / 60);

  return {
    allowed,
    count,
    limit,
    resetIn: resetInMinutes,
    resetAt
  };
}

function normalizeIdentifier(identifier) {
  if (identifier === null || identifier === undefined) {
    return DEFAULT_IDENTIFIER;
  }

  const str = String(identifier).trim();
  return str.length ? str : DEFAULT_IDENTIFIER;
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
    data: {
      used: true,
      usedAt: new Date()
    }
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
function readHeader(req, headerName) {
  if (!req || !req.headers) return undefined;

  const name = headerName.toLowerCase();
  if (typeof req.headers.get === 'function') {
    return req.headers.get(name) || req.headers.get(name.toUpperCase()) || undefined;
  }

  // NextAuth authorize() can pass a plain object of headers (Lowercase keys in v4)
  const headersObj = req.headers;
  return headersObj[name] || headersObj[headerName] || undefined;
}

export function getClientIP(req) {
  const forwarded = readHeader(req, 'x-forwarded-for');
  const realIP = readHeader(req, 'x-real-ip');
  const cfIP = readHeader(req, 'cf-connecting-ip');
  
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
  return readHeader(req, 'user-agent') || 'unknown';
}

/**
 * Build a resilient identifier for rate limiting using IP, UA or a fallback token
 * @param {Request} req - HTTP Request
 * @param {object} options - Additional options
 * @param {string} options.extra - Extra suffix for the identifier
 * @param {string} options.fallback - Custom fallback identifier
 * @returns {string} Rate limit identifier
 */
export function getRateLimitIdentity(req, options = {}) {
  const ip = getClientIP(req);
  const userAgent = getClientUserAgent(req);
  const suffix = options.extra ? `:${options.extra}` : '';

  if (ip && ip !== 'unknown') {
    return `ip:${ip}${suffix}`;
  }

  if (userAgent && userAgent !== 'unknown') {
    return `ua:${hashToken(userAgent).slice(0, 16)}${suffix}`;
  }

  if (options.fallback) {
    return `${options.fallback}${suffix}`;
  }

  return `${DEFAULT_IDENTIFIER}${suffix}`;
}

/**
 * Reset a specific rate limit bucket (useful after successful actions or in tests)
 * @param {string} identifier - Identifier used when checking the limit
 * @param {string} action - Action scope
 */
export function resetRateLimit(identifier, action = 'default') {
  const sanitizedAction = typeof action === 'string' && action.trim() ? action.trim() : 'default';
  rateLimitStore.delete(`${sanitizedAction}:${normalizeIdentifier(identifier)}`);
}

/**
 * Clears all rate limit buckets (ONLY for maintenance/tests)
 */
export function clearAllRateLimits() {
  rateLimitStore.clear();
}

export const SecurityEvents = Object.freeze({
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  OAUTH_FAILED: 'OAUTH_FAILED',
  OAUTH_SUCCESS: 'OAUTH_SUCCESS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SESSION_VERIFICATION_FAILED: 'SESSION_VERIFICATION_FAILED',
  SESSION_ID_MISMATCH: 'SESSION_ID_MISMATCH',
  USER_NOT_FOUND_IN_SESSION: 'USER_NOT_FOUND_IN_SESSION',
  LOCKED_ACCOUNT_ACCESS_ATTEMPT: 'LOCKED_ACCOUNT_ACCESS_ATTEMPT',
  PASSWORD_VERSION_MISMATCH: 'PASSWORD_VERSION_MISMATCH',
  SESSION_INACTIVE: 'SESSION_INACTIVE',
  SESSION_VERIFIED: 'SESSION_VERIFIED',
  SESSION_VERIFICATION_ERROR: 'SESSION_VERIFICATION_ERROR'
});

export async function logSecurityEvent(event, details = {}) {
  const entry = {
    event,
    timestamp: new Date().toISOString(),
    details
  };

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SecurityEvent:${event}]`, entry);
    }
  } catch (error) {
    console.error('[SecurityEvent] Error al registrar evento:', error);
  }

  return entry;
}
