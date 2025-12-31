import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";

/**
 * Derive an encryption key from a password.
 * This key is used to encrypt/decrypt the user's database.
 * The key derivation happens CLIENT-SIDE only - the server never sees it.
 *
 * Uses PBKDF2 via @noble/hashes for cross-platform compatibility
 * (works in browser, Node.js, React Native/Expo Go).
 *
 * @param password - The user's password
 * @param salt - Random per-user salt (generated server-side, stored in DB)
 * @returns A 256-bit (32-byte) hex-encoded encryption key
 */
export async function deriveEncryptionKey(
  password: string,
  salt: string
): Promise<string> {
  const fullSalt = `somar:encrypt:${salt}`;
  return pbkdf2Derive(password, fullSalt);
}

/**
 * PBKDF2 key derivation using @noble/hashes.
 * 100,000 iterations with SHA-256.
 */
async function pbkdf2Derive(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();

  // Derive 32 bytes (256 bits) using PBKDF2-SHA256
  const derivedKey = pbkdf2(sha256, encoder.encode(password), encoder.encode(salt), {
    c: 100000, // iterations
    dkLen: 32, // 256 bits
  });

  return bytesToHex(derivedKey);
}

/**
 * Convert a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
