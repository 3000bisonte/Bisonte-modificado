import "server-only";

import crypto from "crypto";
import type { IncomingHttpHeaders } from "http";

import type { PasswordReset, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "./prisma";

const db = prisma as PrismaClient;

interface RateLimitRecord {
  attempts: number[];
  windowMs: number;
  lastSeen: number;
}

export interface RateLimitOptions {
  now?: number;
  weight?: number;
}

export interface RateLimitResponse {
  allowed: boolean;
  count: number;
  limit: number;
  resetIn: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const DEFAULT_IDENTIFIER = "anonymous";
const MAX_RATE_LIMIT_KEYS = 5000;
const CLEANUP_PROBABILITY = 0.05;

export function checkRateLimit(
  identifier: string,
  action: string = "default",
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  options: RateLimitOptions = {}
): Promise<RateLimitResponse> {
  const now = Number.isFinite(options.now) ? Number(options.now) : Date.now();
  const weight = Math.max(1, Math.floor(options.weight ?? 1));
  const sanitizedAction = typeof action === "string" && action.trim() ? action.trim() : "default";
  const sanitizedIdentifier = normalizeIdentifier(identifier);
  const key = `${sanitizedAction}:${sanitizedIdentifier}`;

  let record = rateLimitStore.get(key);

  if (!record) {
    record = {
      attempts: [],
      windowMs,
      lastSeen: now,
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
    const response = buildRateLimitResponse(false, record.attempts.length, maxAttempts, resetAt, now);
    return Promise.resolve(response);
  }

  for (let index = 0; index < weight; index += 1) {
    record.attempts.push(now);
  }

  const resetAt = record.attempts[0] + windowMs;

  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS || Math.random() < CLEANUP_PROBABILITY) {
    cleanupRateLimit(now);
  }

  const response = buildRateLimitResponse(true, record.attempts.length, maxAttempts, resetAt, now);
  return Promise.resolve(response);
}

export async function checkLoginRateLimit(
  ip: string,
  email: string | null = null
): Promise<{ ipLimit: RateLimitResponse; emailLimit: RateLimitResponse }>
{
  const normalizedIp = normalizeIdentifier(ip);
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : null;

  const ipLimit = await checkRateLimit(normalizedIp, "login_ip", 60, 10 * 60 * 1000);
  const now = Date.now();
  const emailLimit = normalizedEmail
    ? await checkRateLimit(`email:${normalizedEmail}`, "login_email", 12, 10 * 60 * 1000)
    : buildRateLimitResponse(true, 0, 0, now, now);

  const isAllowed = ipLimit.allowed && emailLimit.allowed;

  if (!isAllowed) {
    const blockReason = !ipLimit.allowed ? "IP" : "EMAIL";
    const resetIn = !ipLimit.allowed ? ipLimit.resetIn : emailLimit.resetIn;

    throw new Error(
      `Demasiados intentos desde esta ${blockReason === "IP" ? "dirección IP" : "cuenta"}. Intenta en ${resetIn} minutos.`
    );
  }

  return { ipLimit, emailLimit };
}

function cleanupRateLimit(now = Date.now()): void {
  rateLimitStore.forEach((record, key) => {
    if (!record?.attempts?.length) {
      rateLimitStore.delete(key);
      return;
    }

    const windowMs = record.windowMs ?? 0;
    const windowStart = now - windowMs;
    record.attempts = record.attempts.filter((timestamp) => timestamp > windowStart);

    if (!record.attempts.length || now - (record.lastSeen ?? now) > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  });
}

function buildRateLimitResponse(
  allowed: boolean,
  count: number,
  limit: number,
  resetAt: number,
  now: number
): RateLimitResponse {
  const deltaMs = resetAt - now;
  const resetInMinutes = deltaMs <= 0 ? 0 : Math.ceil(deltaMs / 1000 / 60);

  return {
    allowed,
    count,
    limit,
    resetIn: resetInMinutes,
    resetAt,
  };
}

function normalizeIdentifier(identifier: unknown): string {
  if (identifier === null || identifier === undefined) {
    return DEFAULT_IDENTIFIER;
  }

  const str = String(identifier).trim();
  return str.length ? str : DEFAULT_IDENTIFIER;
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateRecoveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const PASSWORD_STRENGTH_LABELS = ["Muy débil", "Débil", "Moderada", "Fuerte", "Muy fuerte"] as const;

type PasswordStrengthLabel = (typeof PASSWORD_STRENGTH_LABELS)[number];

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  strength: PasswordStrengthLabel;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!"#$%&'()*+,./:;<=>?@[\\\]^_{|}~-]/.test(password);
  const hasNoCommonPatterns = !/(123|abc|password|qwerty|admin)/i.test(password);

  let score = 0;
  if (password.length >= minLength) {
    score += 20;
  }
  if (password.length >= 12) {
    score += 10;
  }
  if (hasUpperCase) {
    score += 15;
  }
  if (hasLowerCase) {
    score += 15;
  }
  if (hasNumbers) {
    score += 15;
  }
  if (hasSpecialChar) {
    score += 15;
  }
  if (hasNoCommonPatterns) {
    score += 10;
  }

  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;

  let strengthText: PasswordStrengthLabel = "Muy débil";
  if (score >= 80) {
    strengthText = "Muy fuerte";
  } else if (score >= 60) {
    strengthText = "Fuerte";
  } else if (score >= 40) {
    strengthText = "Moderada";
  } else if (score >= 20) {
    strengthText = "Débil";
  }

  const errors: string[] = [];
  if (password.length < minLength) {
    errors.push(`Mínimo ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push("Una letra mayúscula");
  }
  if (!hasLowerCase) {
    errors.push("Una letra minúscula");
  }
  if (!hasNumbers) {
    errors.push("Un número");
  }
  if (!hasSpecialChar) {
    errors.push("Un carácter especial");
  }
  if (!hasNoCommonPatterns) {
    errors.push("Evita patrones comunes");
  }

  return {
    isValid,
    score,
    strength: strengthText,
    errors,
  };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface PasswordRecoveryResult {
  token: string;
  code: string;
  expiresAt: Date;
  recoveryId: number;
}

export async function createPasswordRecovery(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<PasswordRecoveryResult> {
  const normalizedEmail = email.toLowerCase();
  const user = await db.usuarios.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    throw new Error("No se puede crear una recuperación para un usuario inexistente.");
  }

  const token = generateSecureToken(32);
  const code = generateRecoveryCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const recovery = await db.passwordReset.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      token: hashToken(token),
      code,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return {
    token,
    code,
    expiresAt,
    recoveryId: recovery.id,
  };
}

export async function verifyRecoveryCode(email: string, code: string): Promise<PasswordReset | null> {
  const recovery = await db.passwordReset.findFirst({
    where: {
      email: email.toLowerCase(),
      code,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!recovery) {
    return null;
  }

  await db.passwordReset.update({
    where: { id: recovery.id },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });

  return recovery;
}

export async function cleanupExpiredRecovery(): Promise<void> {
  await db.passwordReset.deleteMany({
    where: {
      OR: [
        { used: true },
        { expiresAt: { lt: new Date() } },
        { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
}

type HeadersWithGet = {
  get(name: string): string | null;
};

type PlainHeaders = IncomingHttpHeaders | Record<string, string | string[] | undefined>;

type RequestLike = Request | { headers?: Headers | HeadersWithGet | PlainHeaders };

const hasGet = (headers: unknown): headers is HeadersWithGet | Headers =>
  Boolean(headers && typeof (headers as HeadersWithGet).get === "function");

const isPlainHeaders = (headers: unknown): headers is PlainHeaders =>
  typeof headers === "object" && headers !== null && !hasGet(headers);

const asHeaderString = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return typeof value === "string" ? value : undefined;
};

function readHeader(req: RequestLike | null | undefined, headerName: string): string | undefined {
  if (!req || !req.headers) {
    return undefined;
  }

  const headers = req.headers;
  const lowerName = headerName.toLowerCase();

  if (hasGet(headers)) {
    const lower = headers.get(lowerName);
    if (lower) {
      return lower;
    }

    const upper = headers.get(headerName.toUpperCase());
    if (upper) {
      return upper;
    }

    return undefined;
  }

  if (isPlainHeaders(headers)) {
    if (Object.prototype.hasOwnProperty.call(headers, lowerName)) {
      // eslint-disable-next-line security/detect-object-injection
      const lowerValue = asHeaderString(headers[lowerName]);
      if (lowerValue) {
        return lowerValue;
      }
    }

    if (Object.prototype.hasOwnProperty.call(headers, headerName)) {
      // eslint-disable-next-line security/detect-object-injection
      const directValue = asHeaderString(headers[headerName]);
      if (directValue) {
        return directValue;
      }
    }
  }

  return undefined;
}

export function getClientIP(req: RequestLike | null | undefined): string {
  const forwarded = readHeader(req, "x-forwarded-for");
  const realIP = readHeader(req, "x-real-ip");
  const cfIP = readHeader(req, "cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return realIP || cfIP || "unknown";
}

export function getClientUserAgent(req: RequestLike | null | undefined): string {
  return readHeader(req, "user-agent") || "unknown";
}

export interface RateLimitIdentityOptions {
  extra?: string;
  fallback?: string;
}

export function getRateLimitIdentity(req: RequestLike | null | undefined, options: RateLimitIdentityOptions = {}): string {
  const ip = getClientIP(req);
  const userAgent = getClientUserAgent(req);
  const suffix = options.extra ? `:${options.extra}` : "";

  if (ip && ip !== "unknown") {
    return `ip:${ip}${suffix}`;
  }

  if (userAgent && userAgent !== "unknown") {
    return `ua:${hashToken(userAgent).slice(0, 16)}${suffix}`;
  }

  if (options.fallback) {
    return `${options.fallback}${suffix}`;
  }

  return `${DEFAULT_IDENTIFIER}${suffix}`;
}

export function resetRateLimit(identifier: string, action = "default"): void {
  const sanitizedAction = typeof action === "string" && action.trim() ? action.trim() : "default";
  rateLimitStore.delete(`${sanitizedAction}:${normalizeIdentifier(identifier)}`);
}

export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

export const SecurityEvents = {
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  LOGIN_BLOCKED: "LOGIN_BLOCKED",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  OAUTH_FAILED: "OAUTH_FAILED",
  OAUTH_SUCCESS: "OAUTH_SUCCESS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SESSION_VERIFICATION_FAILED: "SESSION_VERIFICATION_FAILED",
  SESSION_ID_MISMATCH: "SESSION_ID_MISMATCH",
  USER_NOT_FOUND_IN_SESSION: "USER_NOT_FOUND_IN_SESSION",
  LOCKED_ACCOUNT_ACCESS_ATTEMPT: "LOCKED_ACCOUNT_ACCESS_ATTEMPT",
  PASSWORD_VERSION_MISMATCH: "PASSWORD_VERSION_MISMATCH",
  SESSION_INACTIVE: "SESSION_INACTIVE",
  SESSION_VERIFIED: "SESSION_VERIFIED",
  SESSION_VERIFICATION_ERROR: "SESSION_VERIFICATION_ERROR",
} as const;

export type SecurityEvent = (typeof SecurityEvents)[keyof typeof SecurityEvents];

export interface SecurityEventEntry {
  event: SecurityEvent;
  timestamp: string;
  details: Record<string, unknown>;
}

export function logSecurityEvent(
  event: SecurityEvent,
  details: Record<string, unknown> = {}
): Promise<SecurityEventEntry> {
  const entry: SecurityEventEntry = {
    event,
    timestamp: new Date().toISOString(),
    details,
  };

  try {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[SecurityEvent:${event}]`, entry);
    }
  } catch (error) {
    console.error("[SecurityEvent] Error al registrar evento:", error);
  }

  return Promise.resolve(entry);
}
