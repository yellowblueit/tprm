import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { getEnv } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from the ENCRYPTION_KEY env var using SHA-256.
 */
function getKey(): Buffer {
  const raw = getEnv().ENCRYPTION_KEY;
  return createHash('sha256').update(raw).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string previously encrypted with `encrypt()`.
 * Expects the format: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask a credential value for display (e.g., "••••abcd").
 * Returns null if the input is null/undefined/empty.
 */
export function maskCredential(value: string | null | undefined): string | null {
  if (!value) return null;
  const last4 = value.length > 4 ? value.slice(-4) : value;
  return `••••${last4}`;
}
